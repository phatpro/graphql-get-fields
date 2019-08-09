/**
 * - Map directive
 *
 * @param {object} directive
 * @param {object} variableValues
 * @returns
 */
function _getDirective(directive, variableValues) {
  const { name, arguments: args } = directive;
  const arg = args[0];
  let directiveValue;

  switch (arg.value.kind) {
    case 'Variable':
      directiveValue = variableValues[arg.value.name.value];
      break;
    case 'BooleanValue':
      directiveValue = arg.value.value;
      break;
    default:
      return directiveValue;
  }

  return {
    [name.value]: directiveValue
  };
}

/**
 * - Get fields
 *
 * @param {object} field
 * @param {object} initial
 * @param {string} parentName
 * @param {object} variableValues
 * @returns
 */
function _getFields(field, initial, parentName, variableValues) {
  const { kind, selectionSet } = field;

  if (kind === 'Field') {
    if (selectionSet && selectionSet.selections) {
      for (let index = 0; index < selectionSet.selections.length; index++) {
        const selection = selectionSet.selections[index];
        const { directives = [] } = selection;

        if (directives.length) {
          let ignore = false;

          for (let i = 0; i < directives.length; i++) {
            const directive = _getDirective(directives[i], variableValues);

            if (directive) {
              const { skip, include } = directive;
              if (skip === true || include === false) {
                ignore = true;

                break;
              }
            }
          }

          if (ignore === true) {
            continue;
          }
        }

        const resultRecursive = _getFields(selection, {}, selection.name.value, variableValues);

        switch (typeof resultRecursive) {
          case 'object':
            initial = {
              ...initial,
              ...resultRecursive
            };
            break;
          case 'number':
            const dotNotation = parentName
              ? parentName + '.' + selection.name.value
              : selection.name.value;
            initial = {
              ...initial,
              [dotNotation]: resultRecursive
            };
            break;
        }
      }
    }

    if (Object.keys(initial).length === 0) {
      return 1;
    }

    return initial;
  }
}

/**
 * - Delete fields
 *
 * @param {object} fieldNodeMapped
 * @param {string[] | string} excludeFields
 * @returns
 */
function _excludeFields(fieldNodeMapped, excludeFields) {
  for (let index = 0; index < excludeFields.length; index++) {
    const excludeField = excludeFields[index];

    fieldNodeMapped[excludeField] && delete fieldNodeMapped[excludeField];
  }

  return fieldNodeMapped;
}

/**
 * - Only fields
 *
 * @param {object} fieldNodeMapped
 * @param {string[]} onlyFields
 * @returns
 */
function _onlyFields(fieldNodeMapped, onlyFields) {
  const paths = Object.keys(fieldNodeMapped);

  return onlyFields.reduce((prev, curr) => {
    const value = fieldNodeMapped[curr];
    if (value) {
      prev = {
        ...prev,
        [curr]: value
      };
    } else {
      const regex = new RegExp(`^${curr}\\.`, 'gs');
      const isExistPath = paths.find(path => path.match(regex));
      if (isExistPath) {
        prev = {
          ...prev,
          [curr]: 1
        };
      }
    }

    return prev;
  }, {});
}

/**
 * - Transform fields from GraphQL to Mongoose project object
 *
 * @param {object} info
 * @param {object[]} info.fieldNodes
 * @param {object} info.variableValues
 * @param {object} options
 * @param {string[]} options.onlyFields
 * @param {string[]} options.excludeFields
 * @returns
 */
function getFieldNames(info, options = {}) {
  const { fieldNodes, variableValues } = info;
  const { onlyFields = [], excludeFields = [] } = options;

  let fieldNodeMapped = _getFields(fieldNodes[0], {}, null, variableValues);

  if (onlyFields.length) {
    return _onlyFields(fieldNodeMapped, onlyFields);
  }
  if (excludeFields.length) {
    return _excludeFields(fieldNodeMapped, excludeFields);
  }

  return fieldNodeMapped;
}

module.exports = getFieldNames;
