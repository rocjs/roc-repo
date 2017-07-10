import { isString, isPlainObject } from 'lodash';

export default class RocExportPlugin {
  constructor(resolveRequest) {
    this.resolveRequest = resolveRequest;
  }

  apply(compiler) {
    const getAlias = createGetAlias(compiler.options.resolve.alias);
    const resolveRequest = this.resolveRequest;
    // Create a random identifer that can be used to detect when our resolver is called
    // recusively so we can prevent an infinite loop
    const recursiveIdentifier = `?rocExportWebpackPlugin=${Math.floor(
      Math.random() * 10 * 10000,
    )}`;
    const createResolver = (resolver, webpackContext = {}) => (
      request,
      context,
      callback,
    ) =>
      resolver(
        webpackContext,
        context,
        request + recursiveIdentifier,
        callback,
      );

    compiler.plugin('after-resolvers', afterResolversCompiler => {
      // We assume that loaders will be managed in Webpack-land, meaning that we will not manage
      // them using exports in Roc
      afterResolversCompiler.resolvers.normal.plugin(
        'module',
        function rocExportWebpackPlugin(result, next) {
          if (result.query === recursiveIdentifier) {
            return next();
          }

          let request = result.request;

          // Use resolve.alias to use the alias if one exists and match
          const beforeAlias = request;
          request = getAlias(request);
          const afterAlias = request;

          // Create resolver that works with Roc
          const resolver = createResolver(
            this.resolve.bind(this),
            result.context,
          );

          // Try to resolve the dependency against the roc dependency context
          return resolveRequest(
            request,
            result.path,
            { resolver },
            (err, newRequest) => {
              // If we failed to resolve we want to propagate the error
              if (err) {
                return next(err);
              }

              // Remove recursiveIdentifier if present
                    newRequest = newRequest.replace(recursiveIdentifier, ''); // eslint-disable-line

              return this.resolve(
                result.context || {},
                result.path,
                newRequest + recursiveIdentifier,
                error => {
                  if (error) {
                    // We got an error and will try again with fallback enabled
                    return resolveRequest(
                      request,
                      result.path,
                      { fallback: true, resolver },
                      (fallbackError, newRequestFallback) => {
                        if (fallbackError) {
                          return next(fallbackError);
                        }

                        // Remove recursiveIdentifier if present
                                    newRequestFallback = newRequestFallback.replace(recursiveIdentifier, ''); // eslint-disable-line

                        // If we have not changed the request we want to revert the alias change
                        request =
                          newRequestFallback === afterAlias
                            ? beforeAlias
                            : newRequestFallback;

                        // Update the resolving with the new value if the request was modified
                        if (request !== result.request) {
                          return this.doResolve(
                            'resolve',
                            { ...result, request },
                            '',
                            next,
                          );
                        }

                        // Do nothing and just pass through
                        return next();
                      },
                    );
                  }

                  // If we have not changed the request we want to revert the alias change
                  request =
                    newRequest === afterAlias ? beforeAlias : newRequest;

                  // Update the resolving with the new value if the request was modified
                  if (request !== result.request) {
                    return this.doResolve(
                      'resolve',
                      { ...result, request },
                      '',
                      next,
                    );
                  }

                  // Do nothing and just pass through
                  return next();
                },
              );
            },
          );
        },
      );
    });
  }
}

// Based on code from enhanced-resolve
function createGetAlias(aliases) {
  if (isPlainObject(aliases) && !Array.isArray(aliases)) {
        aliases = Object.keys(aliases).map((key) => { // eslint-disable-line
      let onlyModule = false;
      let obj = aliases[key];
      if (/\$$/.test(key)) {
        onlyModule = true;
                key = key.substr(0, key.length - 1); // eslint-disable-line
      }
      if (isString(obj)) {
        obj = {
          alias: obj,
        };
      }
      return {
        name: key,
        onlyModule,
        ...obj,
      };
    });
  }

  return request => {
    // eslint-disable-next-line no-restricted-syntax
    for (const alias of aliases) {
      if (
        (!alias.onlyModule && request.indexOf(`${alias.name}/`) === 0) ||
        request === alias.name
      ) {
        if (
          request.indexOf(`${alias.alias}/`) !== 0 &&
          request !== alias.alias
        ) {
          return alias.alias + request.substr(alias.name.length);
        }
      }
    }
    return request;
  };
}
