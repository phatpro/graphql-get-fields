const _ = require('lodash');

function getDirective(directive, variableValues) {
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

function getFields(field, initial, variableValues) {
  const { kind, selectionSet } = field;

  if (kind === 'Field') {
    if (selectionSet && selectionSet.selections) {
      for (let index = 0; index < selectionSet.selections.length; index++) {
        const selection = selectionSet.selections[index];
        const { directives = [] } = selection;

        if (directives.length) {
          for (let i = 0; i < directives.length; i++) {
            const directive = getDirective(directives[i], variableValues);

            if (directive) {
              const { skip, include } = directive;

              if (skip === true || include === false) {
                return initial;
              }
            }
          }
        }

        const resultRecursive = getFields(selection, {}, variableValues);

        if (typeof resultRecursive === 'object') {
          initial = {
            ...initial,
            [selection.name.value]: {
              ...resultRecursive
            }
          };
        } else {
          initial = {
            ...initial,
            [selection.name.value]: resultRecursive
          };
        }
      }
    }

    if (Object.keys(initial).length === 0) {
      return 1;
    }

    return initial;
  }
}

function deleteFields(fieldNodeMapped, excludeFields) {
  return _.omit(fieldNodeMapped, excludeFields);
}

/**
 *
 * @param {object} info
 * @param {object[]} info.fieldNodes
 * @param {object} info.variableValues
 * @param {object} options
 * @param {string[]} options.excludeFields
 * @returns
 */
function getFieldNames(info, options = {}) {
  const { fieldNodes, variableValues } = info;
  const { excludeFields = [] } = options;

  let fieldNodeMapped = getFields(fieldNodes[0], {}, variableValues);
  fieldNodeMapped = deleteFields(fieldNodeMapped, excludeFields);

  return fieldNodeMapped;
}

module.exports = getFieldNames;
