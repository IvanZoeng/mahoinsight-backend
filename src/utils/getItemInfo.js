const queryData = require(__dirname + '/sqliteutil.js');

class Item {
  constructor(id = 0) {
    this.id = parseInt(id);
    if (this.id.toString().length === 5) {
      this.type = "Item";
    } else if (this.id.toString().length === 6) {
      this.type = "Equipment";
    } else {
      this.type = "Unknown";
    }
  }

  _getItemInfo() {
    let ret = '';
    if (this.type === "Item") {
      ret = queryData.queryFromDatabase("select * from item_data where item_id=?", this.id)[0];
    } else if (this.type === "Equipment") {
      ret = queryData.queryFromDatabase("select * from equipment_data where equipment_id=?", this.id)[0];
    } else {
      throw new Error('item type unknown');
    }
    return ret ? ret : false;
  }

  _rewardId2DropRewardId() {
    let result = new Array();
    let row = queryData.queryFromDatabase("select * from enemy_reward_data where reward_id_1=? or reward_id_2=? or reward_id_3=? or reward_id_4=? or reward_id_5=?", [this.id, this.id, this.id, this.id, this.id]);
    if (row.length > 0) {
      row.forEach((item) => {
        let drop_info = new Object();
        drop_info.drop_reward_id = item.drop_reward_id;
        drop_info.drop_count = item.drop_count;
        for (let key of Object.keys(item)) {
          if (item[key] == this.id) {
            let group = key.substring(key.length - 1, key.length);
            drop_info.reward_id = item["reward_id_" + group];
            drop_info.reward_type = item["reward_type_" + group];
            drop_info.reward_num = item["reward_num_" + group];
            drop_info.odds = item["odds_" + group];
          }
        }
        result.push(drop_info);
      });
    }
    return result;
  }

  _dropRewardId2WaveGroupId(drop_reward_id) {
    let result = new Array();
    let row = queryData.queryFromDatabase("select * from wave_group_data where drop_reward_id_1=? or drop_reward_id_2=? or drop_reward_id_3=? or drop_reward_id_4=? or drop_reward_id_5=?", [drop_reward_id, drop_reward_id, drop_reward_id, drop_reward_id, drop_reward_id]);
    if (row.length > 0) {
      row.forEach((item) => {
        let wave_info = new Object();
        for (let key of Object.keys(item)) {
          if (item[key] == drop_reward_id) {
            wave_info.drop_reward_id = item[key];
          }
          wave_info.wave_group_id = item.wave_group_id;
        }
        result.push(wave_info);
      });
    }
    return result;
  }

  _waveGroupId2QuestId(wave_group_id) {
    let result = new Array();
    let row = queryData.queryFromDatabase("select quest_id,area_id,quest_name,stamina from quest_data where wave_group_id_1=? or wave_group_id_2=? or wave_group_id_3=?", [wave_group_id, wave_group_id, wave_group_id]);
    if (row.length > 0) {
      row.forEach((item) => {
        result.push(item);
      });
    }
    return result;
  }

  analyze() {
    this.detail = this._getItemInfo();
    if (this.type != "Equipment" || !this.detail) {
      return -1
    }
    if (this.detail.craft_flg == 0) {
      this.source = new Array();
      this._rewardId2DropRewardId().forEach((reward) => {
        let loot_source = new Object();
        loot_source.drop_count = reward.drop_count;
        loot_source.reward_num = reward.reward_num;
        loot_source.odds = reward.odds;
        loot_source.quest = new Array();
        this._dropRewardId2WaveGroupId(reward.drop_reward_id).forEach((wave) => {
          loot_source.quest.push(this._waveGroupId2QuestId(wave.wave_group_id)[0]);
        });
        this.source.push(loot_source);
      });
    } else if (this.detail.craft_flg == 1) {
      this.craft_by = new Array();
      let craftship = queryData.queryFromDatabase("select * from equipment_craft where equipment_id=?", this.id)[0];
      for (let i = 1; i <= 10; i++) {
        if (craftship["condition_equipment_id_" + i] != 0 && craftship["consume_num_" + i] != 0) {
          this.craft_by.push([craftship["condition_equipment_id_" + i], craftship["consume_num_" + i]])
        }
      }
    }
  }

  static list() {
    let list = new Array();
    for (let item of queryData.queryFromDatabase("select equipment_id from equipment_data").values()){
      list.push(item.equipment_id);
    }
    return list;
  }

  static _craft(equip_id, amount = 1) {
    let row = queryData.queryFromDatabase("select craft_flg from equipment_data where equipment_id=?", equip_id)[0];
    if (row.craft_flg == 0) {
      return -1;
    }
    let craft_by = new Array();
    let craftship = queryData.queryFromDatabase("select * from equipment_craft where equipment_id=?", equip_id)[0];
    for (let i = 1; i <= 10; i++) {
      if (craftship["condition_equipment_id_" + i] != 0 && craftship["consume_num_" + i] != 0) {
        craft_by.push([craftship["condition_equipment_id_" + i], craftship["consume_num_" + i] * amount])
      }
    }
    for (let i = 0; i < craft_by.length; i++) {
      if (Item._craft(craft_by[i][0]) == -1) {
        continue;
      } else {
        let num = craft_by[i][1];
        craft_by[i] = Item._craft(craft_by[i][0], num);
      }
    }
    return craft_by;
  }

  craft() {
    return new Promise(resolve => {
      let craft_by = Item._craft(this.id);
      if (craft_by != -1) {
        craft_by = craft_by.flat(Infinity);
        let ret = new Array();
        for (let i = 0; i < craft_by.length; i = i + 2) {
          ret.push([craft_by[i], craft_by[i + 1]]);
        }
        return resolve(ret);
      } else {
        return resolve(-1);
      }
    });
  }
}

module.exports = Item;
