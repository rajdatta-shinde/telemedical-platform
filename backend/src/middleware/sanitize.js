// Strip MongoDB query operators out of incoming request data.
//
// Mongoose builds queries from values like `req.body.appointmentId`. If a body
// such as `{ "appointmentId": { "$ne": null } }` reaches a query unmodified, the
// operator runs against the database. This middleware recursively removes any
// key that begins with `$` or contains a `.` from req.body / req.query /
// req.params, so a JSON object can no longer smuggle an operator into a query.
//
// Only dangerous KEYS are removed — values are never touched, so a note or
// password that happens to contain `$` or `.` is preserved.
function scrub(value) {
  if (Array.isArray(value)) {
    value.forEach(scrub)
    return
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key]
      } else {
        scrub(value[key])
      }
    }
  }
}

export function sanitizeMongo(req, _res, next) {
  scrub(req.body)
  scrub(req.query)
  scrub(req.params)
  next()
}
