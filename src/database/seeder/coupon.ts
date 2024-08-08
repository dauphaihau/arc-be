import { log } from '@/config';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { CreateCouponBody } from '@/interfaces/request/coupon';
import { IShop } from '@/interfaces/models/shop';
import { faker } from '@faker-js/faker';
import moment from 'moment';
import {
  COUPON_TYPES,
  COUPON_CONFIG,
  COUPON_APPLIES_TO,
  COUPON_MIN_ORDER_TYPES,
} from '@/config/enums/coupon';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { Coupon, Product } from '@/models';
import mongoose from 'mongoose';

const limitApplyCoupon = 3;

const SUFFIX_CODES = {
  [COUPON_TYPES.PERCENTAGE]: 'PC',
  [COUPON_TYPES.FIXED_AMOUNT]: 'FA',
  [COUPON_TYPES.FREE_SHIP]: 'FS',
};

const initBaseCoupon = async (
  shop: IShop,
  type: COUPON_TYPES,
  code: ICouponDoc['code'],
  min_order_type = COUPON_MIN_ORDER_TYPES.NONE,
  applies_to = COUPON_APPLIES_TO.ALL,
  isAutoSale = false,
  otherBody?: Partial<CreateCouponBody>,
) => {
  const max_uses_per_user = faker.number.int({
    min: 1,
    max: COUPON_CONFIG.MAX_USES_PER_USER,
  });
  const start_date = faker.number.int({ min: 1, max: 300 });
  const end_date = faker.number.int({ min: start_date, max: 300 });

  const body: CreateCouponBody = {
    shop: shop.id,
    type,
    code: code.slice(0, COUPON_CONFIG.MAX_CHAR_CODE),
    max_uses_per_user,
    percent_off: 0,
    amount_off: 0,
    min_order_value: 0,
    min_products: 0,
    max_uses: faker.number.int({
      min: max_uses_per_user,
      max: PRODUCT_CONFIG.MAX_STOCK,
    }),
    is_active: true,
    min_order_type,
    applies_to,
    start_date: moment().add(start_date, 'days').toDate(),
    end_date: moment().add(end_date, 'days').toDate(),
    is_auto_sale: isAutoSale,
    ...otherBody,
  };

  if (type === COUPON_TYPES.PERCENTAGE) {
    body.percent_off = faker.number.int({ min: 1, max: COUPON_CONFIG.MAX_PERCENTAGE_OFF });
  }

  if (type === COUPON_TYPES.FIXED_AMOUNT) {
    body.amount_off = faker.number.int({
      min: 1,
      max: 200
    });
  }

  if (!isAutoSale && min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL) {
    body.min_order_value = faker.number.int({
      min: 1,
      max: 200
    });
  }

  if (!isAutoSale && min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS) {
    body.min_products = faker.number.int({ min: 1, max: 20 });
  }

  if (applies_to === COUPON_APPLIES_TO.SPECIFIC) {
    const products = await Product.aggregate([
      { $match: { shop: new mongoose.Types.ObjectId(shop.id) }},
      { $sample: { size: limitApplyCoupon } }, // randomly selects
      { $project: { _id: 1 } }
    ])
    body.applies_product_ids = products.map(prod => prod._id);
  }
  return Coupon.create(body);
};

export async function generateCoupons(shops: IShop[]) {
  const coupons: Promise<ICouponDoc>[] = [];

  shops.forEach((shop) => {
    // ex: Jeanne Shop 0 -> JEANNE
    const shopName = shop.shop_name.split(' ')[0].toUpperCase();

    //region promo coupons
    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.FREE_SHIP,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.FREE_SHIP]}`,
      COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS,
      COUPON_APPLIES_TO.ALL,
      false,
      { start_date: new Date() }
    ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.FIXED_AMOUNT,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.FIXED_AMOUNT]}`,
      COUPON_MIN_ORDER_TYPES.ORDER_TOTAL,
      COUPON_APPLIES_TO.SPECIFIC,
      false,
      { start_date: new Date() }
    ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.PERCENTAGE,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.PERCENTAGE]}-11`,
      COUPON_MIN_ORDER_TYPES.ORDER_TOTAL,
      COUPON_APPLIES_TO.ALL,
      false,
      { start_date: new Date() }
    ));
    //endregion

    //region sale coupons
    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.FREE_SHIP,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.FREE_SHIP]}-OPS1`,
      COUPON_MIN_ORDER_TYPES.NONE,
      COUPON_APPLIES_TO.SPECIFIC,
      true,
      {
        start_date: new Date()
      }
    ));

    // coupons.push(initBaseCoupon(
    //   shop,
    //   COUPON_TYPES.FREE_SHIP,
    //   `${shopName}-${SUFFIX_CODES[COUPON_TYPES.FREE_SHIP]}-OPS`,
    //   COUPON_MIN_ORDER_TYPES.NONE,
    //   COUPON_APPLIES_TO.ALL,
    //   true,
    //   {
    //     start_date: new Date()
    //   }
    // ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.PERCENTAGE,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.PERCENTAGE]}`,
      COUPON_MIN_ORDER_TYPES.NONE,
      COUPON_APPLIES_TO.ALL,
      true,
      {
        start_date: new Date()
      }
    ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.PERCENTAGE,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.PERCENTAGE]}-OPS`,
      COUPON_MIN_ORDER_TYPES.NONE,
      COUPON_APPLIES_TO.ALL,
      true,
      {
        start_date: new Date()
      }
    ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.PERCENTAGE,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.PERCENTAGE]}-OIS`,
      COUPON_MIN_ORDER_TYPES.NONE,
      COUPON_APPLIES_TO.SPECIFIC,
      true,
    {
      start_date: new Date()
    }
    ));

    coupons.push(initBaseCoupon(
      shop,
      COUPON_TYPES.PERCENTAGE,
      `${shopName}-${SUFFIX_CODES[COUPON_TYPES.PERCENTAGE]}-OISI`,
      COUPON_MIN_ORDER_TYPES.NONE,
      COUPON_APPLIES_TO.SPECIFIC,
      true,
      {
        start_date: new Date()
      }
    ));
    //endregion

  });

  await Promise.all(coupons);
  log.info('coupons collection generated');
}
