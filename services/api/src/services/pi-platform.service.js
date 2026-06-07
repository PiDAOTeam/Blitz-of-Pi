const https = require("https");
const { PI_PLATFORM_API_BASE, PI_API_KEY } = require("../config");

const PI_API_TIMEOUT_MS = 8000;

function requestWithHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
        family: 4,
        timeout: PI_API_TIMEOUT_MS
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            async json() {
              return body ? JSON.parse(body) : {};
            },
            async text() {
              return body;
            }
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Pi 平台 API 连接超时"));
    });
    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function requestPiPlatform(path, options = {}) {
  const url = new URL(path, PI_PLATFORM_API_BASE.endsWith("/") ? PI_PLATFORM_API_BASE : `${PI_PLATFORM_API_BASE}/`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PI_API_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    console.warn(`[pi-platform] fetch failed, retrying with IPv4: ${error.message}`);
    return requestWithHttps(url, options);
  } finally {
    clearTimeout(timer);
  }
}

async function readPiError(response) {
  try {
    const text = await response.text();
    return text ? `: ${text.slice(0, 180)}` : "";
  } catch {
    return "";
  }
}

async function verifyPiAccessToken(accessToken) {
  if (!accessToken) {
    throw new Error("缺少 Pi accessToken");
  }

  const response = await requestPiPlatform("v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Pi 登录校验失败: ${response.status}${await readPiError(response)}`);
  }

  return response.json();
}

async function approvePiPayment(paymentId) {
  if (!PI_API_KEY) {
    throw new Error("未配置 PI_API_KEY，无法确认 Pi 支付");
  }

  const response = await requestPiPlatform(`v2/payments/${paymentId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Key ${PI_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Pi 支付 approve 失败: ${response.status}${await readPiError(response)}`);
  }

  return response.json();
}

async function getPiPayment(paymentId) {
  if (!PI_API_KEY) {
    throw new Error("未配置 PI_API_KEY，无法查询 Pi 支付");
  }

  const response = await requestPiPlatform(`v2/payments/${paymentId}`, {
    headers: {
      Authorization: `Key ${PI_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Pi 支付查询失败: ${response.status}${await readPiError(response)}`);
  }

  return response.json();
}

async function completePiPayment(paymentId, txid) {
  if (!PI_API_KEY) {
    throw new Error("未配置 PI_API_KEY，无法完成 Pi 支付");
  }

  const response = await requestPiPlatform(`v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Key ${PI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ txid })
  });

  if (!response.ok) {
    throw new Error(`Pi 支付 complete 失败: ${response.status}${await readPiError(response)}`);
  }

  return response.json();
}

module.exports = {
  verifyPiAccessToken,
  getPiPayment,
  approvePiPayment,
  completePiPayment
};
