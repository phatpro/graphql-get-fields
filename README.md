# graphql-get-fields

Transform fields from GraphQL to Mongoose project object

### Installation

```sh
npm install graphql-get-fields
```

### Usage

```sh
const getFields = require('graphql-get-fields');

// Example query
//      query getTodos {
//          todos {
//               userId @include(if: true)
//               id
//               title
//               completed @skip(if: true) @include(if: false)
//               details {
//                    description
//                    createAt
//                    updateAt
//               }
//          }
//      }

const fieldNames = getFields(info, {
    excludeFields: ['details.createAt', 'details.updateAt']
})

// Output
// fieldNames = { userId: 1, id: 1, title: 1, 'details.description': 1 }
```

### Params

- info: graphql resolve info object (required)
- options:
  - excludeFields (default: [])

## License

MIT
