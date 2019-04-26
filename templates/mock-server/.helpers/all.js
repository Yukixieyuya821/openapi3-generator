const stringifyObject = require('stringify-object');
// Module constructor provides dependency injection from the generator instead of relying on require's cache here to ensure
// the same instance of Handlebars gets the helpers installed and Lodash is definitiely available
// regardless of where remote templates reside: in another Node project or a plain directory, which may have different or no modules available.
module.exports = (Handlebars, _) =>{

  /**
   * Compares two values.
   */
  Handlebars.registerHelper('equal', (lvalue, rvalue, options) => {
    if (arguments.length < 3)
      throw new Error('Handlebars Helper equal needs 2 parameters');
    if (lvalue!=rvalue) {
      return options.inverse(this);
    }

    return options.fn(this);
  });

  /**
   * Checks if a string ends with a provided value.
   */
  Handlebars.registerHelper('endsWith', (lvalue, rvalue, options) => {
    if (arguments.length < 3)
      throw new Error('Handlebars Helper equal needs 2 parameters');
    if (lvalue.lastIndexOf(rvalue) !== lvalue.length-1 || lvalue.length-1 < 0) {
      return options.inverse(this);
    }
    return options.fn(this);
  });

  /**
   * Checks if a method is a valid HTTP method.
   */
  Handlebars.registerHelper('validMethod', (method, options) => {
    const authorized_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'COPY', 'HEAD', 'OPTIONS', 'LINK', 'UNLIK', 'PURGE', 'LOCK', 'UNLOCK', 'PROPFIND'];

    if (arguments.length < 3)
      throw new Error('Handlebars Helper validMethod needs 1 parameter');
    if (authorized_methods.indexOf(method.toUpperCase()) === -1) {
      return options.inverse(this);
    }

    return options.fn(this);
  });

  /**
   * Genarate a collection of success response.
   */
  Handlebars.registerHelper('resolveMockResponse', (response, options) => {
    const data = _.get(response, 'content.application/json.schema.generatedExample');
    if(!data) return '{}'
    const dataExtendArray = _.cloneDeepWith(data, value => {
      // 对象数组长度扩展
      if(Array.isArray(value) && _.isPlainObject(value[0])) {
        return [{...value[0]}, {...value[0]}]
      }
    });
    const result = _.cloneDeepWith(dataExtendArray, (value, key) => {
      // 值转化
      // 特殊值
      if(key === 'pageIndex') return null;
      if(key === 'pageSize') return null;
      if(key === 'sort') return null;
      if(key === 'totalElements') return 50;
      if(key === 'totalPages') return null;

      // id -> mock id
      if(key === 'id' || /Id$/.test(key)) return _.uniqueId(key);
      if(key === 'name' || /Name$/.test(key)) return _.uniqueId(key);
      if(key === 'code' || /Code$/.test(key)) return _.uniqueId(key);

      // 普通字符 -> key
      if(value === 'string') return key;
      // 普通数字 -> 1 TODD: 优化普通数字转化逻辑
      if(value === 0) return 1;
    })
    return stringifyObject(result);
  });

  /**
   * Checks if a collection of responses contains no error responses.
   */
  Handlebars.registerHelper('ifNoErrorResponses', (responses, options) => {
    const codes = responses ? Object.keys(responses) : [];
    if (codes.find(code => Number(code) >= 400)) return options.inverse(this);

    return options.fn(this);
  });

  /**
   * Checks if a collection of responses contains no success responses.
   */
  Handlebars.registerHelper('ifNoSuccessResponses', (responses, options) => {
    const codes = responses ? Object.keys(responses) : [];
    if (codes.find(code => Number(code) >= 200 && Number(code) < 300)) return options.inverse(this);

    return options.fn(this);
  });

  /**
   * Checks if a string matches a RegExp.
   */
  Handlebars.registerHelper('match', (lvalue, rvalue, options) => {
    if (arguments.length < 3)
      throw new Error('Handlebars Helper match needs 2 parameters');
    if (!lvalue.match(rvalue)) {
      return options.inverse(this);
    }

    return options.fn(this);
  });

  /**
   * Provides different ways to compare two values (i.e. equal, greater than, different, etc.)
   */
  Handlebars.registerHelper('compare', (lvalue, rvalue, options) => {
    if (arguments.length < 3) throw new Error('Handlebars Helper "compare" needs 2 parameters');

    const operator = options.hash.operator || '==';
    const operators = {
      '==':       (l,r) => { return l == r; },
      '===':      (l,r) => { return l === r; },
      '!=':       (l,r) => { return l != r; },
      '<':        (l,r) => { return l < r; },
      '>':        (l,r) => { return l > r; },
      '<=':       (l,r) => { return l <= r; },
      '>=':       (l,r) => { return l >= r; },
      typeof:     (l,r) => { return typeof l == r; }
    };

    if (!operators[operator]) throw new Error(`Handlebars Helper 'compare' doesn't know the operator ${operator}`);

    const result = operators[operator](lvalue,rvalue);

    if (result) {
      return options.fn(this);
    }

    return options.inverse(this);
  });

  /**
   * Capitalizes a string.
   */
  Handlebars.registerHelper('capitalize', (str) => {
    return _.capitalize(str);
  });

  /**
   * Converts a string to its camel-cased version.
   */
  Handlebars.registerHelper('camelCase', (str) => {
    return _.camelCase(str);
  });

  /**
   * Converts a multi-line string to a single line.
   */
  Handlebars.registerHelper('inline', (str) => {
    return str ? str.replace(/\n/g, '') : '';
  });

}
