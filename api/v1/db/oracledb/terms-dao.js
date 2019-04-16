const appRoot = require('app-root-path');
const _ = require('lodash');

const { serializeTerms, serializeTerm } = require('../../serializers/terms-serializer');

const { getConnection } = appRoot.require('api/v1/db/oracledb/connection');
const { contrib } = appRoot.require('api/v1/db/oracledb/contrib/contrib');


/**
 * @summary Get current term code
 * @function
 * @param {Object} connection
 * @returns {string} current term code
 */
const getCurrentTermCode = async (connection) => {
  const { rows } = await connection.execute(contrib.getCurrentTerm());
  if (_.isEmpty(rows) || rows.length > 1) {
    return new Error('Expect a single object but got multiple results.');
  }
  return rows[0].termCode;
};

/**
 * @summary Return a list of terms
 * @function
 * @param {string} query
 * @returns {Promise} Promise object represents a list of terms
 */
const getTerms = query => new Promise(async (resolve, reject) => {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms());
    const currentTermCode = await getCurrentTermCode(connection);

    const serializedTerms = serializeTerms(rows, currentTermCode, query);
    resolve(serializedTerms);
  } catch (err) {
    reject(err);
  } finally {
    connection.close();
  }
});

/**
 * @summary Return a specific term by unique term code
 * @function
 * @param {string} termCode Unique term code
 * @returns {Promise} Promise object represents a specific term
 */
const getTermByTermCode = termCode => new Promise(async (resolve, reject) => {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms(termCode), [termCode]);
    const currentTermCode = await getCurrentTermCode(connection);

    if (_.isEmpty(rows)) {
      resolve(undefined);
    } else if (rows.length > 1) {
      reject(new Error('Expect a single object but got multiple results.'));
    } else {
      const [rawTerm] = rows;
      const serializedTerm = serializeTerm(rawTerm, currentTermCode);
      resolve(serializedTerm);
    }
  } catch (err) {
    reject(err);
  } finally {
    connection.close();
  }
});

module.exports = { getTerms, getTermByTermCode };