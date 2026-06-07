function send(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data = null, message = "success") {
  send(res, 200, {
    code: 0,
    message,
    data
  });
}

function notFound(res) {
  send(res, 404, {
    code: 1004,
    message: "资源不存在",
    data: null
  });
}

module.exports = {
  ok,
  notFound
};

