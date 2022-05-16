'use strict';

function setNestedPropertyValue(obj, fields, val) {
  let cur = obj;
  const last = fields.pop();

  fields.forEach(function loop(field) {
    cur[field] = {};
    cur = cur[field];
  });

  cur[last] = val;

  return obj;
}

function removeNestedPropertyValue(obj, fields) {
  let cur = obj;
  const last = fields.pop();

  fields.forEach(function loop(field) {
    cur = cur[field];
  });

  delete cur[last];

  return obj;
}

module.exports = {
  setNestedPropertyValue,
  removeNestedPropertyValue,
};
