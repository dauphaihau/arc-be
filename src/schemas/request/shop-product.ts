import { z } from 'zod';
import { baseCreateProductSchema, baseUpdateProductSchema } from '../services/product';
import {
  objectIdHttpSchema
} from '@/schemas/utils/objectId.schema';
import { PRODUCT_CONFIG, PRODUCT_VARIANT_TYPES } from '@/config/enums/product';
import {
  productInventorySchema,
  productSchema,
  productImageSchema,
  productStateUserCanModify,
  productVariantSchema
} from '@/schemas';
import { productShippingSchema } from '@/schemas/product-shipping.schema';

//region create product
export const baseCreateProductBodySchema = baseCreateProductSchema
  .omit({
    shop: true,
    category: true,
  })
  .merge(
    z.object({
      category_id: objectIdHttpSchema,
      attributes: z.array(
        z.object({
          attribute_id: objectIdHttpSchema,
          selected: z.string(),
        })
      ).optional(),
      shipping: productShippingSchema.pick({
        country: true,
        zip: true,
        process_time: true,
        standard_shipping: true,
      }),
    })
  );

const noneVariantSchema = z
  .object({
    variant_type: z.literal(PRODUCT_VARIANT_TYPES.NONE),
  })
  .merge(
    productInventorySchema.pick({
      price: true,
      stock: true,
      sku: true,
    })
  );

export const singleVariantSchema = z.object({
  variant_type: z.literal(PRODUCT_VARIANT_TYPES.SINGLE),
  variant_group_name: productSchema.shape.variant_group_name,
  variant_options: z.array(
    z.object({
      variant_name: productVariantSchema.shape.variant_name,
    })
      .merge(
        productInventorySchema.pick({ sku: true, price: true, stock: true })
      )
  ),
});

export const combineVariantSchema = z.object({
  variant_type: z.literal(PRODUCT_VARIANT_TYPES.COMBINE),
  variant_group_name: productSchema.shape.variant_group_name,
  variant_sub_group_name: productSchema.shape.variant_sub_group_name,
  variant_options: z.array(
    z.object({
      variant_name: productVariantSchema.shape.variant_name,
      variant_options: z.array(
        z.object({
          variant_name: productVariantSchema.shape.variant_name,
        })
          .merge(
            productInventorySchema.pick({ sku: true, price: true, stock: true })
          )
      ),
    })
  ),
});

const conditionsSchema = z.discriminatedUnion('variant_type', [
  noneVariantSchema,
  singleVariantSchema,
  combineVariantSchema,
]);

export const createProductBodySchema = z.intersection(conditionsSchema, baseCreateProductBodySchema);
//endregion

//region update product
const variantOptionsUpdateSchema = z.object({
  variant_id: objectIdHttpSchema.optional(),
  variant_name: productVariantSchema.shape.variant_name,
}).merge(
  productInventorySchema.pick({ price: true, sku: true, stock: true })
);

export const baseUpdateProductBodySchema = baseUpdateProductSchema
  .merge(
    z.object({
      // id: objectIdHttpSchema,
      shipping: objectIdHttpSchema,
      category_id: objectIdHttpSchema,
      attributes: z.array(
        z.object({
          attribute_id: objectIdHttpSchema,
          selected: z.string(),
        })
      ).optional(),
      state: productStateUserCanModify,
      images: z
        // .array(productImageSchema.partial())
        .array(productImageSchema.merge(
          // z.object({ id: objectIdSchema })
          z.object({ id: objectIdHttpSchema })
        ).partial())
        // .array(productImageSchema.merge(
        //   z.object({ id: objectIdHttpSchema })
        // ))
        .min(PRODUCT_CONFIG.MIN_IMAGES)
        .max(PRODUCT_CONFIG.MAX_IMAGES),
    })
  )
  .partial();


export const updateNoneVariantSchema = z.object({
  variant_type: z.literal(PRODUCT_VARIANT_TYPES.NONE),
}).merge(
  productInventorySchema.pick({ price: true, sku: true, stock: true })
);

export const updateSingleVariantSchema = z.object({
  variant_type: z.literal(PRODUCT_VARIANT_TYPES.SINGLE),
  delete_variants_ids: z
    .array(objectIdHttpSchema)
    .optional(),
  update_variants: z
    .array(
      z.object({
        id: objectIdHttpSchema,
        variant_name: productVariantSchema.shape.variant_name.optional(),
      })
        .merge(productInventorySchema.pick({ price: true, sku: true, stock: true })).partial()
        .strict()
    )
    .optional(),
  new_single_variants: z
    .array(
      productInventorySchema.pick({
        price: true,
        sku: true,
        stock: true,
      }).merge(
        productVariantSchema.pick({ variant_name: true })
      )
    )
    .optional(),
});

export const updateCombineVariantSchema = z.object({
  variant_type: z.literal(PRODUCT_VARIANT_TYPES.COMBINE),
  delete_variants_ids: z
    .array(objectIdHttpSchema)
    .optional(),
  update_variants: z
    .array(
      z.object({
        id: objectIdHttpSchema,
        variant_name: productVariantSchema.shape.variant_name.optional(),
      }).strict()
      // productVariantSchema
      //   .pick({ id: true, variant_name: true })
      //   .partial({ variant_name: true })
      //   .strict()
    )
    .optional(),
  variant_inventories: z
    .array(
      z.object({
        inventory_id: objectIdHttpSchema,
      })
        .merge(
          productInventorySchema.pick({
            price: true, sku: true, stock: true,
          })
        )
    )
    .optional(),
  new_combine_variants: z.array(
    z.object({
      variant_name: productVariantSchema.shape.variant_name,
      variant_options: z.array(variantOptionsUpdateSchema),
    })
  ),
});

const updateConditionsSchema = z.discriminatedUnion('variant_type', [
  updateNoneVariantSchema,
  updateSingleVariantSchema,
  updateCombineVariantSchema,
]);

export const updateProductBodySchema = z.intersection(updateConditionsSchema, baseUpdateProductBodySchema);
//endregion


// export const updateProductSchema = productSchema
//   .omit({
//     shop: true,
//     rating_average: true,
//     views: true,
//   // variants: true,
//   }).merge(
//     z.object({
//       id: objectIdHttpSchema,
//       inventory: objectIdHttpSchema,
//       shipping: objectIdHttpSchema,
//       category: objectIdHttpSchema,
//       attributes: z.array(
//         z.object({
//           attribute: objectIdHttpSchema,
//           selected: z.string(),
//         })
//       ).optional(),
//       state: productStateUserCanModify,
//       images: z
//         .array(productImageSchema.partial())
//       //   .array(productImageSchema.merge(
//       //     z.object({ id: objectIdHttpSchema })
//       //   ).partial())
//         .min(PRODUCT_CONFIG.MIN_IMAGES)
//         .max(PRODUCT_CONFIG.MAX_IMAGES),
//
//
//       update_variants: z
//         .array(
//           productVariantSchema
//             .pick({ id: true, variant_name: true })
//             .partial({ variant_name: true })
//             .strict()
//         )
//         .optional(),
//       variant_inventories: z
//         .array(
//           productInventorySchema
//             .pick({
//               id: true, price: true, sku: true, stock: true,
//             })
//             .strict()
//         )
//         .optional(),
//       new_single_variants: z
//         .array(
//           productInventorySchema.pick({
//             price: true,
//             sku: true,
//             stock: true,
//           }).merge(
//             productVariantSchema.pick({ variant_name: true })
//           )
//         ),
//       new_combine_variants: z.array(
//         productVariantSchema
//           .pick({ variant_name: true })
//           .merge(
//             z.object({
//               variant_options: z.array(
//                 variantOptionsUpdateSchema.partial({ variant: true })
//                 // .refine((value) => !value?.variant && !value?.variant_name, 'required at least variant or variant_name field')
//               ),
//             })
//           ))
//         .optional(),
//     })
//   ).merge(
//     productInventorySchema.pick({ price: true, sku: true, stock: true })
//   ).partial();
