const Item = require(__dirname + '/getItemInfo.js');
const Princess = require(__dirname + '/getPrincessInfo.js');
const Quest = require(__dirname + '/getQuestInfo.js');

class Getter {
  constructor(type, id = 0) {
    this.type = type;
    this.id = id;
  }

  static _getChara(id) {
    if (id === 0) {
      return Princess.list();
    } else {
      let r = new Princess(id);
      r.connect();
      return r;
    }
  }

  static _getCharaAll() {
    let obj = new Object();
    Princess.list().forEach(chara => {
      obj[this._getChara(chara).status.unit_name] = this._getChara(chara);
    });
    return obj;
  }

  static _getItem(id) {
    if (id === 0) {
      return Item.list();
    } else {
      let r = new Item(id);
      r.analyze();
      return r;
    }
  }

  static _getItemAll() {
    let obj = new Object();
    Item.list().forEach(item => {
      obj[this._getItem(item).detail.equipment_name] = this._getItem(item);
    });
    return obj;
  }

  static _getQuest(id) {
    if (id === 0) {
      return Quest.getQuestList();
    } else {
      const q = new Quest(id);
      q.getQuestLootDetail();
      q.getQuestEnemyDetail();
      return q;
    }
  }

  static _getQuestAll() {
    const quest = Quest.getQuestList(), obj = {
      normal: new Object(),
      hard: new Object(),
      other: new Object(),
      area: Quest.getQuestArea()
    };
    let q = new Object();
    quest.normal.map(quest => {
      q = new Quest(quest);
      q.getQuestLootDetail();
      q.getQuestEnemyDetail();
      obj.normal[quest] = q;
    });
    quest.hard.map(quest => {
      q = new Quest(quest);
      q.getQuestLootDetail();
      q.getQuestEnemyDetail();
      obj.hard[quest] = q;
    });
    quest.other.map(quest => {
      q = new Quest(quest);
      q.getQuestLootDetail();
      q.getQuestEnemyDetail();
      obj.other[quest] = q;
    });
    return obj;
  }

  _get() {
    switch (this.type) {
      case 'chara':
        return Getter._getChara(this.id);
      case 'item':
        return Getter._getItem(this.id);
      case 'quest':
        return Getter._getQuest(this.id);
      default:
        throw new Error('incorrect type');
    }
  }

  get(key = '') {
    let r = this._get();
    if (!r || r == -1) {
      return -1;
    }
    return r.hasOwnProperty(key) ? this._get()[key] : this._get();
  }
}

module.exports = Getter;
