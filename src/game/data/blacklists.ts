// ============================================================
// 违规词库
// ============================================================

/** 品牌黑名单（含常见变体） */
export const BRAND_BLACKLIST: string[] = [
  'Nike', 'nike', 'NIKE',
  'Adidas', 'adidas', 'ADIDAS',
  'Gucci', 'gucci', 'GUCCI',
  'Louis Vuitton', 'LV', 'lv',
  'Dyson', 'dyson', 'DYSON',
  'Apple', 'apple', 'APPLE',
  'iPhone', 'iphone', 'IPHONE',
  'Stanley', 'stanley', 'STANLEY',
  'Lululemon', 'lululemon',
  'Chanel', 'chanel', 'CHANEL',
  'Hermes', 'hermes', 'HERMES',
  'Rolex', 'rolex', 'ROLEX',
  'Supreme', 'supreme', 'SUPREME',
  'Dior', 'dior', 'DIOR',
  'Prada', 'prada', 'PRADA',
  'Balenciaga', 'balenciaga',
  'Samsung', 'samsung', 'SAMSUNG',
  'Sony', 'sony', 'SONY',
  'LEGO', 'lego', 'Lego',
  'Disney', 'disney', 'DISNEY',
  'Marvel', 'marvel', 'MARVEL',
  'Pokemon', 'pokemon', 'POKEMON',
  'Genuine', 'genuine', 'GENUINE',
  'Authentic', 'authentic', 'AUTHENTIC',
  'Original', 'original', 'ORIGINAL',
  '100% Genuine', '100% Authentic',
];

/** 绝对化用语黑名单 */
export const ABSOLUTE_BLACKLIST: string[] = [
  '最好', '第一', '第一品牌', '第一选择',
  '100%', '百分百', '百分之百',
  '永久', '永不', '终身',
  '根治', '特效', '神效', '奇效',
  '一秒见效', '立竿见影', '马上见效',
  '全球第一', '世界第一', '全国第一',
  '顶级', '极致', '无敌',
  '绝对', '绝不', '零风险',
  '最佳', '最优', '最强',
  '全网最低', '最低价', '最便宜',
  '独一无二', '绝无仅有',
];

/** 医疗功效黑名单（无认证时不可用） */
export const MEDICAL_BLACKLIST: string[] = [
  '防癌', '抗癌', '治癌',
  '治病', '治病救人',
  '消炎', '抗菌', '杀菌', '消毒',
  '美白祛斑', '祛斑', '祛痘',
  '减肥', '瘦身', '燃脂',
  '降压', '降糖', '降血脂',
  '修复细胞', '激活细胞', '再生',
  '抗衰老', '逆龄', '返老还童',
  '排毒', '清肠', '净化血液',
  '增强免疫力', '提高免疫',
  '治疗', '治愈', '康复',
  '医疗器械', '药妆', '医美',
];
