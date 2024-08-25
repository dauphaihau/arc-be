import { log } from '@/config';
import { IShopDoc } from '@/interfaces/models/shop';
import { IUserDoc } from '@/interfaces/models/user';
import { ProductCartToAdd } from '@/interfaces/request/cart';
import { Cart, Product, User, UserAddress } from '@/models';

type ShopCart = {
  shop: IShopDoc['id'];
  products: ProductCartToAdd[];
}

async function createUserCart(user: IUserDoc, shops: IShopDoc[]) {
  const shop_carts: ShopCart[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const products = await Product
      .find({ shop: shop.id, variant_type: 'none' })
      .limit(5);

      shop_carts.push({
        shop: shop.id,
        products: products.map((prod) => ({
          product: prod.id,
          inventory: prod.inventory,
          quantity: 1,
        })),
      });
    }),
  );

  await Cart.create({
    user: user?.id,
    items: shop_carts,
  });

  log.info('user cart created');
}

async function createTempUserCart(user: IUserDoc) {
  const product = await Product.findOne({ variant_type: 'none' });
  if (!product) return;

  await Cart.create({
    user: user.id,
    items: [
      {
        shop: product.shop,
        products: [{
          product: product.id,
          inventory: product.inventory,
          quantity: 1,
        }],
      },
    ],
    is_temp: true,
  });

  log.info('user temp cart created');
}

async function createUserAddress(user: IUserDoc) {
  await UserAddress.create({
    user: user.id,
    full_name: user.name,
    address1: '11 Le Lai',
    city: 'Saigon',
    state: 'Saigon',
    country: 'Vietnam',
    zip: '700000',
    phone: '09011111111'
  });

}

export async function generateMe() {
  const user = await User.findOne();

  log.debug('user %o', user);
  if (!user) return;
  await createUserAddress(user);

  // const shops = await Shop.find().limit(2);
  // if (shops.length === 0) return;
  // await createUserCart(user, shops);

  // await createTempUserCart(user);
}
