const _ = require('lodash');

/**
 * - Map directive
 *
 * @param {object} directive
 * @param {object} variableValues
 * @returns
 */
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

/**
 * - Get fields
 *
 * @param {object} field
 * @param {object} initial
 * @param {string} parentName
 * @param {object} variableValues
 * @returns
 */
function getFields(field, initial, parentName, variableValues) {
	const { kind, selectionSet } = field;

	if (kind === 'Field') {
		if (selectionSet && selectionSet.selections) {
			for (let index = 0; index < selectionSet.selections.length; index++) {
				const selection = selectionSet.selections[index];
				const { directives = [] } = selection;

				if (directives.length) {
					let ignore = false;

					for (let i = 0; i < directives.length; i++) {
						const directive = getDirective(directives[i], variableValues);

						if (directive) {
							const { skip, include } = directive;
							if (skip === true || include === false) {
								ignore = true;

								// exit current directives loop
								break;
							}
						}
					}

					if (ignore === true) {
						// move to next selection
						// not run code below
						continue;
					}
				}

				const resultRecursive = getFields(
					selection,
					{},
					selection.name.value,
					variableValues
				);

				switch (typeof resultRecursive) {
					case 'object':
						initial = {
							...initial,
							...resultRecursive
						};
						break;
					case 'number':
						const dotAnotation = parentName
							? parentName + '.' + selection.name.value
							: selection.name.value;
						initial = {
							...initial,
							[dotAnotation]: resultRecursive
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
function deleteFields(fieldNodeMapped, excludeFields) {
	return _.omit(fieldNodeMapped, excludeFields);
}

/**
 * - Transform fields from GraphQL to Mongoose project object
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

	let fieldNodeMapped = getFields(fieldNodes[0], {}, null, variableValues);
	fieldNodeMapped = deleteFields(fieldNodeMapped, excludeFields);

	return fieldNodeMapped;
}

module.exports = {
	getFieldNames
};
