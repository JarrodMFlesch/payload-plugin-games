import { CollectionConfig } from 'payload'

export const snakeCollection: CollectionConfig = {
  slug: 'snake',
  admin: {
    group: 'Games',
    components: {
      views: {
        edit: {
          root: {
            Component: '@/plugin/games/snake/views/Edit#EditView',
          },
        },
      },
    },
  },
  labels: {
    singular: 'Snake Game',
    plural: 'Snake Games',
  },
  fields: [
    {
      type: 'ui',
      name: 'snakeGame',
      admin: {
        components: {
          Field: '@/plugin/games/snake/components/Game#SnakeGame',
        },
      },
    },
    {
      name: 'scores',
      type: 'array',
      fields: [
        {
          type: 'text',
          name: 'score',
        },
        {
          type: 'date',
          name: 'date',
        },
      ],
    },
    {
      type: 'relationship',
      relationTo: 'users',
      name: 'player',
    },
  ],
}
