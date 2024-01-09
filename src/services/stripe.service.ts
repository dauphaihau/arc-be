import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { stripeClient, env, log } from '@/config';
import { ORDER_STATUSES } from '@/config/enums/order';
import {
  IClearProductsReverseByOrder,
  IGetCheckoutSessionUrlPayload
} from '@/interfaces/models/order';
import { IUser } from '@/interfaces/models/user';
import { inventoryService } from '@/services/inventory.service';
import { orderService } from '@/services/order.service';
import { ApiError, transactionWrapper } from '@/utils';

// x 100: with USD, stripe use cents ( ex: $1000 -> $10.00 )
const convertCurrencyStripe = (price: number) => price * 100;

async function getCheckoutSessionUrl(
  user: IUser,
  payload: IGetCheckoutSessionUrlPayload
) {
  const { id: user_id, email } = user;
  const { newOrder, productsFlattened, userAddress } = payload;

  if (!productsFlattened) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Something wrong');
  }

  const line_items = productsFlattened.map((product) => (
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.title,
          images: [product.image_url],
          metadata: {
            shop_id: product.shop_id as string,
            product_id: product.id as string,
          },
        },
        unit_amount: convertCurrencyStripe(product.price),
      },
      quantity: product.quantity,
    }
  ));

  const params: Stripe.Checkout.SessionCreateParams = {
    submit_type: 'pay',
    mode: 'payment',
    customer_email: email,
    metadata: {
      user_id,
      order_id: newOrder.id as string,
    },
    line_items,
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: convertCurrencyStripe(newOrder.shipping_fee),
            currency: 'usd',
          },
          display_name: 'Total shops',
        },
      },
    ],
    payment_method_types: ['card'],
    expires_at: Math.floor(Date.now() / 1000) + (1800 * 2), // expire after 1 hour
    success_url: `${env.cors_origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: env.cors_origin,
  };

  if (userAddress) {
    // auto prefill shipping address
    params.payment_intent_data = {
      shipping: {
        name: userAddress.full_name,

        address: {
          country: userAddress.country,
          state: userAddress.state,
          city: userAddress.city,
          line1: userAddress.address1,
          line2: userAddress.address2 != null ? userAddress.address2 : '',
          postal_code: userAddress.zip,
        },
      },
    };
  } else {
    params.phone_number_collection = { enabled: true };
    params.shipping_address_collection = { allowed_countries: ['US', 'CA', 'AU', 'IT', 'JP', 'SG', 'FR', 'DE', 'GB'] };
  }

  if (newOrder.total_discount > 0) {
    const coupon = await stripeClient.coupons.create({
      name: 'DISCOUNT',
      duration: 'once',
      currency: 'usd',
      amount_off: convertCurrencyStripe(newOrder.total_discount),
      metadata: {
        user_id,
        order_id: newOrder.id as string,
      },
    });
    if (!coupon) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Create stripe coupon failed');
    }
    params.discounts = [{ coupon: coupon.id }];
  }

  log.debug('params %o', params);
  const session = await stripeClient.checkout.sessions.create(params);
  return session.url;
}

async function onEventStripe(event: Stripe.Event) {
  switch (event.type) {
    case 'charge.succeeded':
      break;
    case 'checkout.session.completed': {
      const session = event.data.object;
      log.debug('session complete %o', session);

      await transactionWrapper(async (sessionMongo) => {
        if (session.metadata && session.metadata['order_id']) {
          const order = await orderService.updateOrderById(session.metadata['order_id'], {
            status: ORDER_STATUSES.PAID,
          }, sessionMongo);
          await inventoryService.clearProductsReverseByOrder(
            order as IClearProductsReverseByOrder,
            sessionMongo
          );
        }
      });
    }
      break;
    default:
      log.info(`Unhandled event type ${event.type}`);
  }
}

export const stripeService = {
  onEventStripe,
  getCheckoutSessionUrl,
};
