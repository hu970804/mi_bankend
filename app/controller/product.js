'use strict';

const { Controller } = require('egg');

class ProductController extends Controller {

  async listProducts() {
    const { query } = this.ctx.request;
    const products = await this.ctx.service.product.listProducts(query);
    this.ctx.body = {
      code: 0,
      data: {
        products,
      },
    };
  }

  async getProduct() {
    const { id } = this.ctx.params;
    // const {product, goodsList} = await this.ctx.service.product.getProductDetail(id);

    const ps = [
      this.ctx.service.product.getProductDetail(id),
      // TODO add this services
      // this.ctx.service.comment.getProductComment({
      //   product_id: id,
      //   limit: 20,
      // }),
      // this.ctx.service.activity.getActivities({
      //   product_id: id,
      //   limit: 20,
      // }),
    ];

    const [ productResult, comments, activities ]  = await Promise.all(ps);

    this.ctx.body = {
      code: 0,
      data: {
        product: productResult.product, 
        goodsList: productResult.goodsList,
        comments,
        activities
      },
    };
  }

}

module.exports = ProductController;
