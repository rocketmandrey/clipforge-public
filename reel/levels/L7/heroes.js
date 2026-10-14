// L7/heroes.js — from the clipforge chibi_paper kit (own code, MIT with this repo). Only import paths changed.
// heroes.js: the chibi_paper cast — the kids from kevin_t_ngo's four paper gifs (ref/kngo/g1-g4), as drawChibi specs.
// Add a hero = add one entry.  Fields: hair (short|spiky|curly|afro|long|curlyLong|bob|bun|braids|ponytail|topknot|none),
// hat (beanie|cap), top (plain|stripes|blocks|kimono|hoodie|jacket|overalls|raglan), bottom (pants|shorts|skirt), eyes, mouth, arms, props.
const FAIR = '#f7d7bf', TAN = '#d9a27a', BROWN = '#a8704d', DARK = '#7a4a32', BLK = '#25201e';
export const HEROES = {
  // g1 hide-and-seek
  vodyashiy: { name: 'Водящий', g: 'g1', seed: 1, skin: FAIR, hair: 'spiky', hairCol: '#f2c94c', top: 'stripes', topCol: '#f1ead8', topCol2: '#4f9a5a', bottom: 'pants', bottomCol: '#4c6fa8', shoes: '#9a9ca2' },
  puchok: { name: 'Пучок', g: 'g1', seed: 2, skin: TAN, hair: 'bun', hairCol: BLK, top: 'kimono', topCol: '#ef9fb0', topCol2: '#6aa86e', bottom: 'pants', bottomCol: '#f0a8b8', shoes: '#e78aa0' },
  kudryash: { name: 'Кудряш', g: 'g1', seed: 3, skin: FAIR, hair: 'curly', hairCol: '#e8792f', freckles: true, eyes: 'happy', top: 'stripes', topCol: '#d8443a', topCol2: '#3d5fa8', bottom: 'pants', bottomCol: '#4c6fa8', shoes: '#d8443a' },
  shapka: { name: 'Шапка', g: 'g1', seed: 4, skin: BROWN, hair: 'short', hairCol: '#5a3a26', hat: 'beanie', hatCol: '#d64a3a', hatCol2: '#f1e7d2', top: 'blocks', topCol: '#3d63b0', topCol2: '#e9b43c', topCol3: '#d8443a', bottom: 'pants', bottomCol: '#7a7d45', shoes: '#2f3550' },
  tikhonya: { name: 'Тихоня', g: 'g1', seed: 5, skin: DARK, hair: 'long', hairCol: BLK, eyes: 'half', mouth: 'flat', top: 'plain', topCol: '#f1ead8', bottom: 'pants', bottomCol: '#a99ac9', shoes: '#2a2a2e' },
  // g2 rainbow ribbon
  ochkarik: { name: 'Очкарик', g: 'g2', seed: 6, skin: FAIR, hair: 'long', hairCol: '#6b4430', glasses: true, top: 'hoodie', topCol: '#ef9aa8', bottom: 'skirt', bottomCol: '#2f3b6b', socks: true, shoes: '#2f3b6b', arms: 'hold', prop: 'yarn' },
  ryzhiy: { name: 'Рыжий', g: 'g2', seed: 7, skin: FAIR, hair: 'spiky', hairCol: '#e8792f', freckles: true, top: 'plain', topCol: '#f4f1ea', bottom: 'shorts', bottomCol: '#8fb4dd', socks: true, shoes: '#c99a5a' },
  lokhmatiy: { name: 'Лохматый', g: 'g2', seed: 8, skin: DARK, hair: 'spiky', hairCol: BLK, mouth: 'open', eyes: 'happy', top: 'plain', topCol: '#2c3557', bottom: 'pants', bottomCol: '#c4a86e', shoes: '#9a9ca2' },
  // g3 The Great Leap
  prygunya: { name: 'Прыгунья', g: 'g3', seed: 9, skin: DARK, hair: 'topknot', hairCol: BLK, top: 'raglan', topCol: '#f4f1ea', topCol2: '#ef8a3c', bottom: 'shorts', bottomCol: '#8a8d93', socks: true, shoes: '#c99a5a' },
  kosichki: { name: 'Косички', g: 'g3', seed: 10, skin: BROWN, hair: 'braids', hairCol: BLK, eyes: 'happy', mouth: 'open', top: 'stripes', topCol: '#efe0c4', topCol2: '#e39a52', bottom: 'skirt', bottomCol: '#8a8d93', socks: true, shoes: '#3a3a3e' },
  blondin: { name: 'Блондин', g: 'g3', seed: 11, skin: FAIR, hair: 'short', hairCol: '#f0cf6a', eyes: 'happy', top: 'hoodie', topCol: '#a3a6aa', bottom: 'shorts', bottomCol: '#7d8187', socks: true, shoes: '#55585e' },
  ryzhik: { name: 'Рыжик', g: 'g3', seed: 12, skin: FAIR, hair: 'curly', hairCol: '#e8792f', eyes: 'happy', mouth: 'open', top: 'stripes', topCol: '#f1ead8', topCol2: '#5c9a72', bottom: 'shorts', bottomCol: '#b9a37a', socks: true, shoes: '#5c9a72', arms: 'up' },
  pushistaya: { name: 'Пушистая', g: 'g3', seed: 13, skin: DARK, hair: 'afro', hairCol: '#3b2a22', top: 'plain', topCol: '#f1b9bd', bottom: 'skirt', bottomCol: '#8a8d93', socks: true, shoes: '#f1b9bd' },
  kare: { name: 'Каре', g: 'g3', seed: 14, skin: FAIR, hair: 'bob', hairCol: BLK, eyes: 'happy', mouth: 'open', top: 'overalls', topCol: '#ef8a3c', overallCol: '#7d8187', bottom: 'pants', bottomCol: '#7d8187', shoes: '#ef8a3c', arms: 'up' },
  babulya: { name: 'Бабуля', g: 'g3', seed: 15, skin: FAIR, hair: 'curly', hairCol: '#dcdad5', glasses: true, mouth: 'o', top: 'jacket', topCol: '#8a8d93', topCol2: '#f1ead8', bottom: 'pants', bottomCol: '#7a5a42', shoes: '#3a3a3e', arms: 'hold', sign: '10' },
  sudya: { name: 'Судья', g: 'g3', seed: 16, skin: DARK, hair: 'ponytail', hairCol: BLK, top: 'plain', topCol: '#9a9ca0', bottom: 'skirt', bottomCol: '#7d8187', socks: true, shoes: '#3a3a3e', arms: 'hold', sign: '10' },
  zelshapka: { name: 'Зелёная шапка', g: 'g3', seed: 17, skin: FAIR, hair: 'short', hairCol: '#e8792f', hat: 'beanie', hatCol: '#5b9a6c', hatCol2: '#f1ead8', eyes: 'half', mouth: 'flat', top: 'plain', topCol: '#6aa27a', bottom: 'pants', bottomCol: '#7a5a42', shoes: '#5b9a6c', arms: 'hold', sign: '9' },
  // g4 pixel heart
  kudryavaya: { name: 'Кудрявая', g: 'g4', seed: 18, skin: BROWN, hair: 'curlyLong', hairCol: BLK, glasses: true, top: 'jacket', topCol: '#efe6d2', topCol2: '#2a2a2e', bottom: 'skirt', bottomCol: '#5b78a6', plaid: true, socks: true, shoes: '#2a2a2e' },
  kepka: { name: 'Кепка', g: 'g4', seed: 19, skin: BROWN, hair: 'short', hairCol: '#2a201c', hat: 'cap', hatCol: '#d8574a', top: 'overalls', topCol: '#f1ead8', overallCol: '#4d6fa6', bottom: 'pants', bottomCol: '#4d6fa6', shoes: '#d8443a', prop: 'pencil', mouth: 'o' },
  kosichkiRyzhie: { name: 'Косички-рыжие', g: 'g4', seed: 20, skin: FAIR, hair: 'braids', hairCol: '#e8792f', freckles: true, eyes: 'happy', top: 'plain', topCol: '#a9d8b8', bottom: 'skirt', bottomCol: '#c8443a', plaid: true, socks: true, shoes: '#6b4430' },
};
