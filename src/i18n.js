const dict = {
  pt: {
    nav_menu: 'Menu',
    brand_sub: 'Praia Morena · Benguela',
    cta_call: 'Ligar',
    cta_call_full: 'Ligar +244 925 963 030',
    hero_eyebrow: 'Bem-vindo ao',
    hero_mini:
      'Sabor de casa à beira-mar na Praia Morena, em Benguela. Explore o nosso menu e os preços abaixo.',
    cta_menu: 'Ver Menu',
    sec_menu: 'Menu',
    menu_sub: 'A nossa ementa',
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
  },
  en: {
    nav_menu: 'Menu',
    brand_sub: 'Praia Morena · Benguela',
    cta_call: 'Call',
    cta_call_full: 'Call +244 925 963 030',
    hero_eyebrow: 'Welcome to',
    hero_mini:
      'Home-style flavours by the sea at Praia Morena, Benguela. Browse our menu and prices below.',
    cta_menu: 'See the Menu',
    sec_menu: 'Menu',
    menu_sub: 'Our menu',
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