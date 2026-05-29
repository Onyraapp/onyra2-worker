
// src/lib/i18n/translations.js
// Troco — Diccionario de traducciones ES / PT / EN

export const translations = {
  es: {
    // App general
    appName: 'Troco',
    appTagline: 'el control diario de tu negocio',

    // Auth
    auth: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tenés cuenta?',
      register: 'Registrarse',
      loginError: 'Email o contraseña incorrectos',
    },

    // Navegación
    nav: {
      home: 'Inicio',
      cash: 'Caja',
      history: 'Historial',
      products: 'Productos',
      settings: 'Configuración',
      reports: 'Reportes',
    },

    // Caja
    cash: {
      open: 'Abrir caja',
      close: 'Cerrar caja',
      openAmount: 'Monto de apertura',
      closeAmount: 'Monto de cierre',
      currentBalance: 'Saldo actual',
      income: 'Ingreso',
      expense: 'Egreso',
      addIncome: 'Agregar ingreso',
      addExpense: 'Agregar egreso',
      concept: 'Concepto',
      amount: 'Monto',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      cashIsOpen: 'Caja abierta',
      cashIsClosed: 'Caja cerrada',
      noCashOpen: 'No hay caja abierta',
      openFirst: 'Abrí la caja para comenzar',
      dailySummary: 'Resumen del día',
      totalIncome: 'Total ingresos',
      totalExpense: 'Total egresos',
      difference: 'Diferencia',
    },

    // Historial
    history: {
      title: 'Historial de cajas',
      noHistory: 'No hay historial todavía',
      date: 'Fecha',
      openedAt: 'Apertura',
      closedAt: 'Cierre',
      movements: 'Movimientos',
      seeDetail: 'Ver detalle',
    },

    // Productos
    products: {
      title: 'Productos',
      add: 'Agregar producto',
      edit: 'Editar',
      delete: 'Eliminar',
      name: 'Nombre',
      price: 'Precio',
      category: 'Categoría',
      noProducts: 'No hay productos cargados',
      confirmDelete: '¿Eliminar este producto?',
    },

    // Configuración
    settings: {
      title: 'Configuración',
      businessName: 'Nombre del negocio',
      currency: 'Moneda',
      language: 'Idioma',
      theme: 'Tema',
      save: 'Guardar cambios',
      saved: 'Guardado correctamente',
    },

    // Mensajes generales
    common: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar',
      success: '¡Listo!',
      delete: 'Eliminar',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Volver',
      search: 'Buscar',
      noResults: 'Sin resultados',
      today: 'Hoy',
      yesterday: 'Ayer',
    },

    // Monedas comunes en LATAM
    currencies: {
      ARS: 'Peso argentino',
      BRL: 'Real brasileño',
      CLP: 'Peso chileno',
      COP: 'Peso colombiano',
      MXN: 'Peso mexicano',
      PEN: 'Sol peruano',
      UYU: 'Peso uruguayo',
      USD: 'Dólar estadounidense',
    },
  },

  pt: {
    appName: 'Troco',
    appTagline: o controle diário da sua loja
    auth: {
      login: 'Entrar',
      logout: 'Sair',
      email: 'E-mail',
      password: 'Senha',
      forgotPassword: 'Esqueceu a senha?',
      noAccount: 'Não tem conta?',
      register: 'Cadastrar',
      loginError: 'E-mail ou senha incorretos',
    },

    nav: {
      home: 'Início',
      cash: 'Caixa',
      history: 'Histórico',
      products: 'Produtos',
      settings: 'Configurações',
      reports: 'Relatórios',
    },

    cash: {
      open: 'Abrir caixa',
      close: 'Fechar caixa',
      openAmount: 'Valor de abertura',
      closeAmount: 'Valor de fechamento',
      currentBalance: 'Saldo atual',
      income: 'Entrada',
      expense: 'Saída',
      addIncome: 'Adicionar entrada',
      addExpense: 'Adicionar saída',
      concept: 'Descrição',
      amount: 'Valor',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      cashIsOpen: 'Caixa aberto',
      cashIsClosed: 'Caixa fechado',
      noCashOpen: 'Nenhum caixa aberto',
      openFirst: 'Abra o caixa para começar',
      dailySummary: 'Resumo do dia',
      totalIncome: 'Total entradas',
      totalExpense: 'Total saídas',
      difference: 'Diferença',
    },

    history: {
      title: 'Histórico de caixas',
      noHistory: 'Nenhum histórico ainda',
      date: 'Data',
      openedAt: 'Abertura',
      closedAt: 'Fechamento',
      movements: 'Movimentos',
      seeDetail: 'Ver detalhe',
    },

    products: {
      title: 'Produtos',
      add: 'Adicionar produto',
      edit: 'Editar',
      delete: 'Excluir',
      name: 'Nome',
      price: 'Preço',
      category: 'Categoria',
      noProducts: 'Nenhum produto cadastrado',
      confirmDelete: 'Excluir este produto?',
    },

    settings: {
      title: 'Configurações',
      businessName: 'Nome do negócio',
      currency: 'Moeda',
      language: 'Idioma',
      theme: 'Tema',
      save: 'Salvar alterações',
      saved: 'Salvo com sucesso',
    },

    common: {
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      retry: 'Tentar novamente',
      success: 'Pronto!',
      delete: 'Excluir',
      edit: 'Editar',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Voltar',
      search: 'Buscar',
      noResults: 'Sem resultados',
      today: 'Hoje',
      yesterday: 'Ontem',
    },

    currencies: {
      ARS: 'Peso argentino',
      BRL: 'Real brasileiro',
      CLP: 'Peso chileno',
      COP: 'Peso colombiano',
      MXN: 'Peso mexicano',
      PEN: 'Sol peruano',
      UYU: 'Peso uruguaio',
      USD: 'Dólar americano',
    },
  },

  en: {
    appName: 'Troco',
    appTagline:'daily control of your business',

    auth: {
      login: 'Sign in',
      logout: 'Sign out',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      noAccount: "Don't have an account?",
      register: 'Sign up',
      loginError: 'Incorrect email or password',
    },

    nav: {
      home: 'Home',
      cash: 'Cash',
      history: 'History',
      products: 'Products',
      settings: 'Settings',
      reports: 'Reports',
    },

    cash: {
      open: 'Open register',
      close: 'Close register',
      openAmount: 'Opening amount',
      closeAmount: 'Closing amount',
      currentBalance: 'Current balance',
      income: 'Income',
      expense: 'Expense',
      addIncome: 'Add income',
      addExpense: 'Add expense',
      concept: 'Description',
      amount: 'Amount',
      confirm: 'Confirm',
      cancel: 'Cancel',
      cashIsOpen: 'Register open',
      cashIsClosed: 'Register closed',
      noCashOpen: 'No register open',
      openFirst: 'Open the register to start',
      dailySummary: "Today's summary",
      totalIncome: 'Total income',
      totalExpense: 'Total expenses',
      difference: 'Difference',
    },

    history: {
      title: 'Register history',
      noHistory: 'No history yet',
      date: 'Date',
      openedAt: 'Opened at',
      closedAt: 'Closed at',
      movements: 'Movements',
      seeDetail: 'View detail',
    },

    products: {
      title: 'Products',
      add: 'Add product',
      edit: 'Edit',
      delete: 'Delete',
      name: 'Name',
      price: 'Price',
      category: 'Category',
      noProducts: 'No products added',
      confirmDelete: 'Delete this product?',
    },

    settings: {
      title: 'Settings',
      businessName: 'Business name',
      currency: 'Currency',
      language: 'Language',
      theme: 'Theme',
      save: 'Save changes',
      saved: 'Saved successfully',
    },

    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      success: 'Done!',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      search: 'Search',
      noResults: 'No results',
      today: 'Today',
      yesterday: 'Yesterday',
    },

    currencies: {
      ARS: 'Argentine peso',
      BRL: 'Brazilian real',
      CLP: 'Chilean peso',
      COP: 'Colombian peso',
      MXN: 'Mexican peso',
      PEN: 'Peruvian sol',
      UYU: 'Uruguayan peso',
      USD: 'US dollar',
    },
  },
};

// Mapa de países → idioma por defecto
export const countryToLocale = {
  // Español
  AR: 'es', BO: 'es', CL: 'es', CO: 'es', CR: 'es',
  CU: 'es', DO: 'es', EC: 'es', ES: 'es', GT: 'es',
  HN: 'es', MX: 'es', NI: 'es', PA: 'es', PE: 'es',
  PR: 'es', PY: 'es', SV: 'es', UY: 'es', VE: 'es',
  // Portugués
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  // El resto: inglés
};

export const defaultLocale = 'es';
export const supportedLocales = ['es', 'pt', 'en'];
