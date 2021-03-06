'use strict';

const { Service } = require('egg');

class Inventory extends Service {

  static get ['REDIS_GOODS_LOCKS_BY_ORDER_PREF'] () {
    return 'goods_inventory_locks_by_order:';
  }

  static get ['REDIS_GOODS_LOCKS_PREF'] () {
    return 'goods_inventory_locks:';
  }
  
  static get ['REDIS_GOODS_LOCKS_BY_ORDER_EXPIRE_PREF'] () {
    return 'goods_inventory_locks:';
  }

  static get ['DEFAULT_LOCK_EXPIRE_SECONDS'] () {
    return 1 * 60;
  }

  async addLocksByGoodsId(goodsId, subOrderId, amount) {
    const locksByOrderHsetKey = Inventory.REDIS_GOODS_LOCKS_BY_ORDER_PREF + goodsId;
    const locksKey = Inventory.REDIS_GOODS_LOCKS_PREF + goodsId;
    const locksExpKey = Inventory.REDIS_GOODS_LOCKS_BY_ORDER_EXPIRE_PREF + goodsId + ':' + subOrderId;
    await this.app.redis.incrby(locksKey, amount);
    await this.app.redis.hincrby(locksByOrderHsetKey, subOrderId, amount);
    await this.app.redis.set(locksExpKey, amount, 'PX', Inventory.DEFAULT_LOCK_EXPIRE_SECONDS); // 设置过期时间
  }

  async getLocksByGoodsId(goodsId) {
    const locksKey = Inventory.REDIS_GOODS_LOCKS_PREF + goodsId;
    const lockedAmount = await this.app.redis.get(locksKey);
    return lockedAmount;
  }

  async removeLocksByGoodsId(goodsId, subOrderId) {
    const locksByOrderHsetKey = Inventory.REDIS_GOODS_LOCKS_BY_ORDER_PREF + goodsId;
    const locksKey = Inventory.REDIS_GOODS_LOCKS_PREF + goodsId;
    const locksExpKey = Inventory.REDIS_GOODS_LOCKS_BY_ORDER_EXPIRE_PREF + goodsId + ':' + subOrderId;
    const amountByOrderID = await this.app.redis.hget(locksByOrderHsetKey, subOrderId);
    await this.app.redis.del(locksExpKey)
    await this.app.redis.incrby(locksKey, -1 * amountByOrderID);
  }

  async fillGoodsRealInventory(goodsList) {
    const ps = [];
    for(let i = 0; i < goodsList.length; i++) {
      const goods = goodsList[i]
      ps.push(this.getLocksByGoodsId(goods.id));
    }
    const lockedInventories = await Promise.all(ps);

    for(let i = 0;i < goodsList.length; i++) {
      const goods = goodsList[i];
      goods.Inventory = goods.Inventory - lockedInventories[i];
    }
  }
}

module.exports = Inventory;
