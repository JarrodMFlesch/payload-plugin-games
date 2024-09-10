import { Plugin } from 'payload'
import { snakeCollection } from '@/plugin/games/snake'

const gameCollections = {
  snake: snakeCollection,
}

type Args = {
  games: {
    [key in keyof typeof gameCollections]?: {
      enabled: boolean
    }
  }
}
export function payloadGames({ games }: Args): Plugin {
  return (config) => {
    for (const game in games) {
      const gameKey = game as keyof typeof games
      if (games[gameKey]?.enabled) {
        if (!config.collections) config.collections = []
        config.collections.push(gameCollections[gameKey])
      }
    }

    return config
  }
}
