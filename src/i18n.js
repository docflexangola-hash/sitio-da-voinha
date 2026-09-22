const dict = {
  pt: {
    nav_menu: 'Menu',
    brand_sub: 'Praia Morena · Benguela',
    cta_call: 'Ligar',
    cta_call_full: 'Ligar +244 925 963 030',
    hero_eyebrow: 'Bem-vindo ao',
    hero_mini:
      'Sabor de casa à beira-mar na Praia Morena, em Benguela. Consulte o menu e os preços abaixo.',
    cta_menu: 'Ver Menu',
    sec_menu: 'Menu',
    menu_sub: 'A nossa ementa',
    menu_refeicoes: 'Refeições',
    menu_bebidas: 'Bebidas',
    voinha_close: 'Sinta-se em casa — à mesa ou no escorrega.',
    voinha_play: 'Esplanada familiar · playground à beira-mar',
    badge_esgotado: 'Esgotado',
    count_opcoes: 'opções',
    menu_footer_note:
      'Preços em Kwanza (Kz), sujeitos a alteração. Consulte o garçom para detalhes e receitas do dia.',
    loc_addr_label: 'Endereço',
    loc_addr: 'Avenida dos Restaurantes, Praia Morena, Benguela — Angola',
    loc_hours_label: 'Horário',
    loc_hours: 'Terça a Domingo · 10h00 – 22h00',
    loc_closed: 'Segunda-feira: encerrado',
    loc_phone_label: 'Contacto',
    foot_rights: '© 2026 Sítio da Voinha. Todos os direitos reservados.',
    foot_admin: 'Área reservada',
    foot_cred: 'Desenvolvido por',
    lang_pt: 'Português',
    lang_en: 'Inglês',
    nav_open: 'Abrir menu',
    nav_close: 'Fechar menu',
    a11y_lang: 'Idioma',
    a11y_menu_sections: 'Seções do menu',
    a11y_categorias: 'Categorias do menu',
    galeria_eyebrow: 'Os nossos pratos',
    galeria_title: 'Em fotos',
    a11y_galeria: 'Fotos dos pratos',
    a11y_galeria_prev: 'Foto anterior',
    a11y_galeria_next: 'Foto seguinte',
    a11y_galeria_dot: 'Ir para a foto',
  },
  en: {
    nav_menu: 'Menu',
    brand_sub: 'Praia Morena · Benguela',
    cta_call: 'Call',
    cta_call_full: 'Call +244 925 963 030',
    hero_eyebrow: 'Welcome to',
    hero_mini:
      'Home-style cooking by the sea at Praia Morena, Benguela. See the menu and prices below.',
    cta_menu: 'See the Menu',
    sec_menu: 'Menu',
    menu_sub: 'Our menu',
    menu_refeicoes: 'Food',
    menu_bebidas: 'Drinks',
    voinha_close: 'Make yourself at home — at the table or on the slide.',
    voinha_play: 'Family-friendly terrace · playground by the sea',
    badge_esgotado: 'Sold out',
    count_opcoes: 'options',
    menu_footer_note:
      'Prices in Kwanza (Kz), subject to change. Ask your waiter for daily specials.',
    loc_addr_label: 'Address',
    loc_addr: 'Avenida dos Restaurantes, Praia Morena, Benguela — Angola',
    loc_hours_label: 'Hours',
    loc_hours: 'Tuesday – Sunday · 10:00am – 10:00pm',
    loc_closed: 'Monday: closed',
    loc_phone_label: 'Contact',
    foot_rights: '© 2026 Sítio da Voinha. All rights reserved.',
    foot_admin: 'Reserved area',
    foot_cred: 'Developed by',
    lang_pt: 'Portuguese',
    lang_en: 'English',
    nav_open: 'Open menu',
    nav_close: 'Close menu',
    a11y_lang: 'Language',
    a11y_menu_sections: 'Menu sections',
    a11y_categorias: 'Menu categories',
    galeria_eyebrow: 'Our dishes',
    galeria_title: 'In pictures',
    a11y_galeria: 'Dish photos',
    a11y_galeria_prev: 'Previous photo',
    a11y_galeria_next: 'Next photo',
    a11y_galeria_dot: 'Go to photo',
  },
};

const KEY = 'sdv-lang';
let lang = 'pt';

export function getLang() {
  return lang;
}

export function currentSavedLang() {
  return localStorage.getItem(KEY) === 'en' ? 'en' : 'pt';
}

export function t(key) {
  return (dict[lang] && dict[lang][key]) || key;
}

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'pt';
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  apply();
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang-btn') === lang;
    btn.classList.toggle('bg-primary', isActive);
    btn.classList.toggle('text-on-primary', isActive);
    btn.classList.toggle('text-on-surface-variant', !isActive);
    btn.classList.toggle('hover:text-on-surface', !isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  window.dispatchEvent(new CustomEvent('sdv:lang', { detail: { lang } }));
}

function apply() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[lang][key]) el.textContent = dict[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

export function initI18n() {
  apply(); // pt by default
}