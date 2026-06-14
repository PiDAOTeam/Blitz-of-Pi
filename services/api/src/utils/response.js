function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data = null, message = "success") {
  sendJson(res, 200, {
    code: 0,
    message,
    data
  });
}

function fail(res, message = "请求失败", statusCode = 400, code = 1000, data = null) {
  sendJson(res, statusCode, {
    code,
    message,
    data
  });
}

function notFound(res, message = "资源不存在") {
  sendJson(res, 404, {
    code: 1004,
    message,
    data: null
  });
}

module.exports = {
  ok,
  fail,
  notFound
};
