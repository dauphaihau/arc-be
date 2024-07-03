import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { OrderShop } from '@/models/order-shop.model';
import {
  MARKETPLACE_CURRENCIES,
  MARKETPLACE_CONFIG
} from '@/config/enums/marketplace';
import { inventoryService } from '@/services/product-inventory.service';
import { stripeClient, env, log } from '@/config';
import { ORDER_STATUSES } from '@/config/enums/order';
import { IGetCheckoutSessionUrlPayload } from '@/interfaces/models/order';
import { IUser } from '@/interfaces/models/user';
import { orderService } from '@/services/order.service';
import { ApiError, transactionWrapper } from '@/utils';

const zeroDecimalCurrencies = [
  MARKETPLACE_CURRENCIES.KRW, MARKETPLACE_CURRENCIES.JPY, MARKETPLACE_CURRENCIES.VND,
];

/*
   API requests expect amounts to be provided in a currency’s smallest unit

   so with decimal currencies need x100
   ex: charge $10.00, x100 -> 1000 ( cents )

   if zero decimal currencies without x100
 */
const convertCurrencyStripe = (price: number, currency = MARKETPLACE_CONFIG.BASE_CURRENCY) => {
  if (zeroDecimalCurrencies.includes(currency)) {
    return Math.round(price);
  }
  return Math.round(price * 100);
};

async function getCheckoutSessionUrl(
  user: IUser,
  payload: IGetCheckoutSessionUrlPayload
): Promise<string> {
  const { id: user_id, email } = user;
  const {
    newOrder, orderShops, userAddress, currency,
  } = payload;
  log.debug('getCheckoutSessionUrl newOrder %o', newOrder);

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  let rateCurrency = 1;
  if (currency !== MARKETPLACE_CONFIG.BASE_CURRENCY) {
    const response = await fetch(`https://open.er-api.com/v6/latest/${MARKETPLACE_CONFIG.BASE_CURRENCY}`);
    const exchangeRate = await response.json();
    rateCurrency = exchangeRate.rates[currency];
  }

  orderShops.forEach((order) => {
    return order.products.forEach(product => {
      line_items.push(
        {
          price_data: {
            currency,
            product_data: {
              name: product.title,
              images: [product.image_url],
              metadata: {
                order_id: newOrder.id as string,
              },
            },
            unit_amount: convertCurrencyStripe(product.price * rateCurrency, currency),
          },
          quantity: product.quantity,
        }
      );
    });
  });

  log.debug('getCheckoutSessionUrl line-items %o', line_items);

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
            amount: convertCurrencyStripe(newOrder.shipping_fee * rateCurrency, currency),
            currency,
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
  }
  else {
    params.phone_number_collection = { enabled: true };
    params.shipping_address_collection = { allowed_countries: ['US', 'CA', 'AU', 'IT', 'JP', 'SG', 'FR', 'DE', 'GB'] };
  }

  if (newOrder.total_discount > 0) {
    const coupon = await stripeClient.coupons.create({
      name: 'DISCOUNT',
      duration: 'once',
      currency,
      amount_off: convertCurrencyStripe(newOrder.total_discount * rateCurrency, currency),
      metadata: {
        user_id,
        order_id: newOrder.id as string,
      },
    });
    if (!coupon) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Create stripe coupon failed');
    }
    params.discounts = [{ coupon: coupon.id }];
  }

  log.debug('getCheckoutSessionUrl params checkout session %o', params);
  const session = await stripeClient.checkout.sessions.create(params);
  if (!session.url) {
    log.error('getCheckoutSessionUrl session url being null', session.url);
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  return session.url;
}

async function onEventStripe(event: Stripe.Event) {
  switch (event.type) {
    case 'charge.succeeded':
      break;
    case 'checkout.session.completed': {
      const session = event.data.object;
      // log.debug('session complete %o', session);

      await transactionWrapper(async (sessionMongo) => {
        if (session.metadata && session.metadata['order_id']) {
          const order = await orderService.updateOrderById(session.metadata['order_id'], {
            status: ORDER_STATUSES.PAID,
          }, sessionMongo);
          log.debug('order %o', order);
          const orderShops = await OrderShop.find({ order: order.id });
          await inventoryService.clearProductsReversedByOrder(
            order,
            orderShops,
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

async function getCheckoutSession(sessionId?: string) {
  if (!sessionId) throw new ApiError(StatusCodes.BAD_REQUEST);
  try {
    return await stripeClient.checkout.sessions.retrieve(sessionId);
  }
  catch (error) {
    log.error(error);
    throw new ApiError(StatusCodes.NOT_FOUND);
  }
}

export const stripeService = {
  onEventStripe,
  getCheckoutSessionUrl,
  getCheckoutSession,
};
