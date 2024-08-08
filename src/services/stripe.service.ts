import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import {
  IUserAddressDoc
} from '@/interfaces/models/user-address';
import { Payment } from '@/models/payment.model';
import { couponService } from '@/services/coupon.service';
import { cartService } from '@/services/cart.service';
import {
  MARKETPLACE_CURRENCIES,
  MARKETPLACE_CONFIG
} from '@/config/enums/marketplace';
import { productInventoryService } from '@/services/product-inventory.service';
import { stripeClient, env, log } from '@/config';
import { ORDER_STATUSES } from '@/config/enums/order';
import { orderService } from '@/services/order.service';
import { ApiError, transactionWrapper } from '@/utils';
import { CustomMetaData, GetCheckoutSessionUrlPayload } from '@/interfaces/services/stripe';
import { Order } from '@/models';

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

// export const roundNumAndFixedStripe = (num: number): number => {
//   return Number((Math.ceil(num * 100) / 100).toFixed(2));
// };

async function createCheckoutSessionUrl(
  payload: GetCheckoutSessionUrlPayload
): Promise<string> {
  const {
    user,
    root_order, order_shops, currency,
    cart_id,
  } = payload;
  const { id: user_id, email } = user;

  //region initialize base checkout session params
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  let rateCurrency = 1;
  if (currency !== MARKETPLACE_CONFIG.BASE_CURRENCY) {
    const response = await fetch(`https://open.er-api.com/v6/latest/${MARKETPLACE_CONFIG.BASE_CURRENCY}`);
    const exchangeRate = await response.json();
    rateCurrency = exchangeRate.rates[currency];
  }

  // log.debug('order-shops %o', order_shops);

  if (order_shops && order_shops.length > 0) {
    order_shops.forEach((order) => {
      return order.products.forEach(product => {
        line_items.push(
          {
            price_data: {
              currency,
              product_data: {
                name: product.title,
                images: [product.image_url],
                metadata: {
                  order_id: root_order.id.toString(),
                },
              },
              unit_amount: convertCurrencyStripe(product.price * rateCurrency, currency),
            },
            quantity: product.quantity,
          }
        );
      });
    });
  }
  log.debug('getCheckoutSessionUrl line-items %o', line_items);

  const metadata: CustomMetaData = {
    user_id: user_id.toString(),
    cart_id: cart_id.toString(),
    order_id: root_order.id.toString(),
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    submit_type: 'pay',
    mode: 'payment',
    customer_email: email,
    metadata,
    line_items,
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: convertCurrencyStripe(root_order.total_shipping_fee * rateCurrency, currency),
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
  //endregion

  // region fill user address
  await root_order.populate<{ user_address: IUserAddressDoc }>('user_address').then(doc => {
    log.debug('doc-user-address %o', doc.user_address);
    if (doc.user_address) {
      params.payment_intent_data = {
        shipping: {
          name: doc.user_address.full_name,
          address: {
            country: doc.user_address.country,
            state: doc.user_address.state,
            city: doc.user_address.city,
            line1: doc.user_address.address1,
            line2: doc.user_address.address2 != null ? doc.user_address.address2 : '',
            postal_code: doc.user_address.zip,
          },
        },
      };
    }
    else {
      params.phone_number_collection = { enabled: true };
      params.shipping_address_collection = { allowed_countries: ['US', 'CA', 'AU', 'IT', 'JP', 'SG', 'FR', 'DE', 'GB'] };
    }
    return doc;
  });
  // endregion

  //region create stripe coupon
  if (root_order.total_discount > 0) {
    const coupon = await stripeClient.coupons.create({
      name: 'DISCOUNT',
      duration: 'once',
      currency,
      amount_off: convertCurrencyStripe(root_order.total_discount * rateCurrency, currency),
      // percent_off: roundNumAndFixed(newOrder.total_discount / newOrder.subtotal * 100),
      metadata,
    });
    if (!coupon) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Create stripe coupon failed');
    }
    params.discounts = [{ coupon: coupon.id }];
  }
  //endregion

  const session = await stripeClient.checkout.sessions.create(params);
  if (!session.url) {
    log.error('getCheckoutSessionUrl session url being null', session.url);
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  return session.url;
}

async function onEventStripe(event: Stripe.Event) {
  log.debug('event-type %o', event.type);
  switch (event.type) {
    case 'charge.succeeded':
      break;
    case 'checkout.session.completed': {
      const session = event.data.object;
      const metadata = session.metadata as CustomMetaData;

      await transactionWrapper(async (sessionMongo) => {
        if (
          !metadata ||
          !metadata.user_id ||
          !metadata.order_id || !metadata.cart_id || !session.payment_intent
        ) {
          log.error('session is invalid');
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
        }
        const paymentIntent = await stripeClient.paymentIntents.retrieve(session.payment_intent.toString());
        if (!paymentIntent.payment_method) {
          log.error('payment_method_id is null');
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
        }
        const paymentMethod = await stripeClient.paymentMethods.retrieve(
          paymentIntent.payment_method.toString()
        );
        if (!paymentMethod.card) {
          log.error('payment_method.cart is undefined');
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
        }
        log.debug('payment-method %o', paymentMethod);

        const paymentCreated = await Payment.create([{
          user: metadata.user_id,
          order: metadata.order_id,
          type: paymentMethod.type,
          card_last4: paymentMethod.card.last4,
          card_brand: paymentMethod.card.brand,
          card_exp_month: paymentMethod.card.exp_month,
          card_exp_year: paymentMethod.card.exp_year,
          card_funding: paymentMethod.card.funding,
          stripe_payment_method_id: paymentMethod.id,
        }], { session: sessionMongo });
        if (paymentCreated.length === 0) {
          log.error('create payment failed');
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
        }
        const payment = paymentCreated[0];

        const orderShopsUpdated = await Order.updateMany({
          parent: metadata.order_id,
        }, {
          $set: {
            payment: payment.id,
          },
        }, { session: sessionMongo });

        if (orderShopsUpdated.modifiedCount === 0) {
          log.error('update payment order_shops failed');
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
        }

        const order = await orderService.updateOrderById(metadata.order_id, {
          payment: payment.id,
          status: ORDER_STATUSES.PAID,
        }, sessionMongo);

        const orderShops = await Order.find({ parent: order.id });

        await productInventoryService.clearProductsReversedByOrder(
          order,
          orderShops,
          sessionMongo
        );
        await couponService.clearCouponsReversedByOrder(
          order,
          orderShops,
          sessionMongo
        );
        await cartService.clearProductCartSelected(metadata.cart_id, sessionMongo);
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
  createCheckoutSessionUrl,
  getCheckoutSession,
};
