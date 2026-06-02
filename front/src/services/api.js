const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  let result;
  try {
    result = await response.json();
  } catch (e) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.message || 'Ha ocurrido un error en la solicitud.');
  }
  return result;
};

export const apiService = {
  // Auth API
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  },

  // Categories API
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createCategory: async (categoryData) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response);
  },

  deleteCategory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Transactions API
  getTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTransaction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createTransaction: async (transactionData) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },

  updateTransaction: async (id, transactionData) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },

  deleteTransaction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Accounts API
  getAccounts: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAccount: async (id) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createAccount: async (accountData) => {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  updateAccount: async (id, accountData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  deleteAccount: async (id) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Budgets API
  getBudgetModel: async () => {
    const response = await fetch(`${API_BASE_URL}/budgets/model`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateBudgetModel: async (modelData) => {
    const response = await fetch(`${API_BASE_URL}/budgets/model`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(modelData),
    });
    return handleResponse(response);
  },

  getMonthlyBudgetCompare: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/compare?month=${month}&year=${year}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  generateMonthlyBudget: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/generate?month=${month}&year=${year}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  regenerateMonthlyBudget: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/regenerate?month=${month}&year=${year}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateMonthlyBudget: async (id, budgetData) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(budgetData),
    });
    return handleResponse(response);
  },

  payBudgetItem: async (itemId, payData) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/items/${itemId}/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payData),
    });
    return handleResponse(response);
  },

  unpayBudgetItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/budgets/monthly/items/${itemId}/unpay`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // AI Reports API
  getLatestReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/latest`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getReportHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/history`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  generateReport: async (type, period, forceRecalculate = false) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (period) params.append('period', period);
    if (forceRecalculate) params.append('forceRecalculate', 'true');
    
    const response = await fetch(`${API_BASE_URL}/reports/generate?${params.toString()}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};


