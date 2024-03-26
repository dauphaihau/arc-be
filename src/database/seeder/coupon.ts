import { faker } from '@faker-js/faker';
import moment from 'moment';
import {
  COUPON_TYPES,
  COUPON_CONFIG,
  COUPON_APPLIES_TO,
  COUPON_MIN_ORDER_TYPES
} from '@/config/enums/coupon';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { Coupon, Product } from '@/models';

const couponAmountPerShop = 50;
const limitApplyCoupon = 3;

const initBaseCoupon = async (
  shop,
  type,
  min_order_type = COUPON_MIN_ORDER_TYPES.NONE,
  applies_to = COUPON_APPLIES_TO.ALL,
  isAutoSale = false
) => {

  const max_uses_per_user = faker.number.int({
    min: 1,
    max: COUPON_CONFIG.MAX_USES_PER_USER,
  });
  const start_date = faker.number.int({ min: 1, max: 300 });
  const end_date = faker.number.int({ min: start_date, max: 300 });

  const short_type_coupon = type === COUPON_TYPES.PERCENTAGE ? 'PC' : type === COUPON_TYPES.FIXED_AMOUNT ? 'FA' : 'FS';

  const body = {
    shop: shop.id,
    title: faker.lorem.lines(),
    code: shop.shop_name.split(' ')[0].toUpperCase() + '-' + short_type_coupon,

    type,

    max_uses_per_user,
    max_uses: faker.number.int({
      min: max_uses_per_user,
      max: PRODUCT_CONFIG.MAX_STOCK,
    }),

    min_order_type,
    applies_to,

    start_date: moment().add(start_date, 'days'),
    end_date: moment().add(end_date, 'days'),

    is_auto_sale: isAutoSale,
  };

  if (type === COUPON_TYPES.PERCENTAGE) {
    body.percent_off = faker.number.int({ min: 1, max: 99 });
  }
  if (type === COUPON_TYPES.FIXED_AMOUNT) {
    body.amount_off = faker.number.int({
      min: 1,
      max: PRODUCT_CONFIG.MAX_PRICE - 1,
    });
  }

  if (min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL) {
    body.min_order_value = faker.number.int({
      min: 1,
      max: PRODUCT_CONFIG.MAX_PRICE * 20,
    });
  }
  if (min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS) {
    body.min_products = faker.number.int({ min: 1, max: 20 });
  }
  if (applies_to === COUPON_APPLIES_TO.SPECIFIC) {
    const products = await Product
      .find({ shop: shop.id })
      .limit(limitApplyCoupon)
      .select('_id');
    body.applies_product_ids = products.map(prod => prod._id);
  }
  return Coupon.create(body);
};

export async function generateCouponDB(shops) {

  const products = [];

  shops.forEach((shop) => {
    for (let i = 0; i < couponAmountPerShop; i++) {
      products.push(
        i === 0 ?
          initBaseCoupon(shop, COUPON_TYPES.FREE_SHIP) :
          i === 1 ?
            initBaseCoupon(
              shop, COUPON_TYPES.FIXED_AMOUNT,
              COUPON_MIN_ORDER_TYPES.ORDER_TOTAL,
              COUPON_APPLIES_TO.SPECIFIC,
              true
            ) :
            initBaseCoupon(
              shop, COUPON_TYPES.PERCENTAGE,
              COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS,
              COUPON_APPLIES_TO.SPECIFIC,
              true
            )
      );
      // products.push(initBaseCoupon(shop));
    }
  });
  await Promise.all(products);
}
