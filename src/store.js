import menuData from './data/menu.json';

export const MOEDA = menuData.moeda;

export function makeMenus() {
  return JSON.parse(JSON.stringify(menuData.menus));
}

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function itemKey(menuId, catId, nome) {
  return `${menuId}/${catId}/${slug(nome)}`;
}

const overrideByKey = (overrides) => {
  const map = new Map();
  (overrides || []).forEach((o) => {
    if (o && o.chave) map.set(o.chave, o);
  });
  return map;
};

export function mergeOverrides(menus, overrides) {
  const map = overrideByKey(overrides);
  menus.forEach((menu) => {
    menu.categorias.forEach((cat) => {
      cat.itens.forEach((item) => {
        const key = itemKey(menu.id, cat.id, item.nome);
        const ov = map.get(key);
        if (ov) {
          item._preco = ov.preco != null ? ov.preco : item.preco;
          item._disponivel = ov.disponivel != null ? ov.disponivel : item.preco != null;
        } else {
          item._preco = item.preco;
          item._disponivel = true;
        }
      });
    });
  });
  return menus;
}

export function displayPrice(menuItem) {
  const value = menuItem._preco != null ? menuItem._preco : menuItem.preco;
  const formatted = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted;
}

export function formatKz(value) {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} Kz`;
}

export function countItems(menus) {
  return menus.reduce(
    (acc, menu) => acc + menu.categorias.reduce((a, c) => a + c.itens.length, 0),
    0
  );
}

export function flatCategories(menus, ordemMap) {
  const out = [];
  menus.forEach((menu) => {
    menu.categorias.forEach((cat) => {
      out.push({ menuId: menu.id, catId: cat.id, nome: cat.nome, nome_en: cat.nome_en, itens: cat.itens });
    });
  });
  if (ordemMap && ordemMap.size) {
    return out
      .slice()
      .sort(
        (a, b) =>
          (ordemMap.has(a.catId) ? ordemMap.get(a.catId) : Infinity) -
          (ordemMap.has(b.catId) ? ordemMap.get(b.catId) : Infinity)
      );
  }
  const idx = out.findIndex((c) => c.catId === 'entradas');
  if (idx > 0) {
    const [first] = out.splice(idx, 1);
    out.unshift(first);
  }
  return out;
}