'use client'

import React from 'react'

import './index.scss'

const baseClass = 'snake-game'

const initialSnake = '0_0,1_0,2_0'

function extractSnakeCoordinates(snake: string): { x: number; y: number }[] {
  return snake.split(',').map((segment) => {
    const [x, y] = segment.split('_').map((n) => Number(n.replace('|', '')))
    return { x, y }
  })
}

function formatSnakeCoordinate(x: number, y: number): string {
  return `|${x}_${y}|`
}

function formatSnakeCoordinates(snake: { x: number; y: number }[]): string {
  return snake.map(({ x, y }) => formatSnakeCoordinate(x, y)).join(',')
}

type Props = {
  boardRows?: number
  boardColumns?: number
  ref?: React.Ref<HTMLDivElement>
}
export function SnakeGame({
  boardColumns = 30,
  boardRows = 15,
}: Pick<Props, 'boardColumns' | 'boardRows'>) {
  const currentDirection = React.useRef('right')
  const snakeCoordinateString = React.useRef(initialSnake)
  const treatCoordinateString = React.useRef('')
  const hasInitializedGameRef = React.useRef(false)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const gameRef = React.useRef<HTMLDivElement>(null)
  const gameOverRef = React.useRef(false)
  const changeDirectionRef = React.useRef(false)
  const isPausedRef = React.useRef(false)
  const boardRef = React.useRef<HTMLDivElement>(null)
  const [score, setScore] = React.useState(() => initialSnake.split(',').length)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      if (gameOverRef.current || isPausedRef.current) return

      switch (e.key) {
        case 'ArrowUp':
          if (currentDirection.current !== 'down' && !changeDirectionRef.current) {
            changeDirectionRef.current = true
            currentDirection.current = 'up'
          }
          break
        case 'ArrowDown':
          if (currentDirection.current !== 'up' && !changeDirectionRef.current) {
            changeDirectionRef.current = true
            currentDirection.current = 'down'
          }
          break
        case 'ArrowLeft':
          if (currentDirection.current !== 'right' && !changeDirectionRef.current) {
            changeDirectionRef.current = true
            currentDirection.current = 'left'
          }
          break
        case 'ArrowRight':
          if (currentDirection.current !== 'left' && !changeDirectionRef.current) {
            changeDirectionRef.current = true
            currentDirection.current = 'right'
          }
          break
      }
    }

    boardRef.current?.addEventListener('keydown', handleKeyDown)
    return () => {
      boardRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const placeFood = React.useCallback(() => {
    const treatX = Math.floor(Math.random() * boardColumns)
    const treatY = Math.floor(Math.random() * boardRows)

    while (
      !gameOverRef.current &&
      snakeCoordinateString.current.includes(formatSnakeCoordinate(treatX, treatY))
    ) {
      placeFood()
      return
    }

    const newTreatCoordinateString = formatSnakeCoordinate(treatX, treatY)
    treatCoordinateString.current = treatCoordinateString.current
      ? `${treatCoordinateString.current},${newTreatCoordinateString}`
      : newTreatCoordinateString

    if (gameRef.current) {
      gameRef.current.style.setProperty(`--cell-${treatX}__${treatY}-color`, 'var(--food-color)')
    }
  }, [boardColumns, boardRows])

  const eatFood = React.useCallback(
    (xPos: number, yPos: number) => {
      treatCoordinateString.current = treatCoordinateString.current.replace(
        formatSnakeCoordinate(xPos, yPos),
        '',
      )
      placeFood()
      setScore((prevScore) => prevScore + 1)
    },
    [placeFood],
  )

  const moveSnake = React.useCallback(() => {
    if (!gameRef.current) return

    const snakeStringArray = snakeCoordinateString.current.split(',')
    const prevHead = snakeStringArray[snakeStringArray.length - 1]
    const [{ x: prevHeadX, y: prevHeadY }] = extractSnakeCoordinates(prevHead)
    let { x: headX, y: headY } = { x: prevHeadX, y: prevHeadY }

    switch (currentDirection.current) {
      case 'up':
        headY = prevHeadY - 1 < 0 ? boardRows - 1 : prevHeadY - 1
        break
      case 'down':
        headY = prevHeadY + 1 >= boardRows ? 0 : prevHeadY + 1
        break
      case 'left':
        headX = prevHeadX - 1 < 0 ? boardColumns - 1 : prevHeadX - 1
        break
      case 'right':
        headX = prevHeadX + 1 >= boardColumns ? 0 : prevHeadX + 1
        break
    }

    if (snakeCoordinateString.current.includes(formatSnakeCoordinate(headX, headY))) {
      gameOverRef.current = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      const deadSnakeCoordinates = extractSnakeCoordinates(snakeCoordinateString.current)
      deadSnakeCoordinates.forEach(({ x, y }, index) => {
        if (index === deadSnakeCoordinates.length - 1) {
          gameRef?.current?.style.setProperty(
            `--cell-${x}__${y}-color`,
            'var(--dead-snake-head-color)',
          )
        } else if (index === 0) {
          gameRef?.current?.style.setProperty(
            `--cell-${x}__${y}-color`,
            'var(--dead-snake-tail-color)',
          )
        } else {
          gameRef?.current?.style.setProperty(`--cell-${x}__${y}-color`, 'var(--dead-snake-color)')
        }
      })
      return
    }

    gameRef.current.style.setProperty(`--cell-${headX}__${headY}-color`, 'var(--snake-head-color)')
    gameRef.current.style.setProperty(
      `--cell-${prevHeadX}__${prevHeadY}-color`,
      'var(--snake-color)',
    )

    snakeStringArray.push(formatSnakeCoordinate(headX, headY))
    snakeCoordinateString.current = snakeStringArray.join(',')

    if (snakeCoordinateString.current.includes(treatCoordinateString.current)) {
      eatFood(headX, headY)
    } else {
      const removedTail = snakeStringArray.splice(0, 1)[0]
      const [{ x: tailX, y: tailY }] = extractSnakeCoordinates(removedTail)
      gameRef.current.style.removeProperty(`--cell-${tailX}__${tailY}-color`)
    }

    const newTail = snakeStringArray[0]
    const [{ x: newTailX, y: newTailY }] = extractSnakeCoordinates(newTail)
    gameRef.current.style.setProperty(
      `--cell-${newTailX}__${newTailY}-color`,
      'var(--snake-tail-color)',
    )

    snakeCoordinateString.current = snakeStringArray.join(',')
    changeDirectionRef.current = false
  }, [boardColumns, boardRows, eatFood])

  const constructInterval = React.useCallback(() => {
    isPausedRef.current = false
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      moveSnake()
    }, 50)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [moveSnake])

  const pauseOrResumeGame = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      isPausedRef.current = true
    } else {
      constructInterval()
    }
  }, [constructInterval])

  const initializeBoard = React.useCallback(() => {
    gameOverRef.current = false
    snakeCoordinateString.current = initialSnake
    treatCoordinateString.current = ''
    currentDirection.current = 'right'
    setScore(initialSnake.split(',').length)
    // clear board
    Array.from({ length: boardColumns * boardRows }).forEach((_, i) => {
      const cellX = i % boardColumns
      const cellY = Math.floor(i / boardColumns)
      gameRef?.current?.style.removeProperty(`--cell-${cellX}__${cellY}-color`)
    })
    // place snake
    const snakeParts = initialSnake.split(',')
    snakeParts.forEach((segment, index) => {
      const { x, y } = extractSnakeCoordinates(segment)[0]
      gameRef?.current?.style.setProperty(
        `--cell-${x}__${y}-color`,
        `${index === snakeParts.length - 1 ? 'var(--snake-head-color)' : 'var(--snake-color)'}`,
      )
    })

    placeFood()
    constructInterval()
  }, [placeFood, constructInterval, boardColumns, boardRows])

  React.useEffect(() => {
    if (!hasInitializedGameRef.current) {
      initializeBoard()
      hasInitializedGameRef.current = true
    }
  }, [initializeBoard])

  return (
    <div className={baseClass} ref={gameRef}>
      <h1>Snake game</h1>
      <Board ref={boardRef} boardColumns={boardColumns} boardRows={boardRows} />
      <div>
        Score{' '}
        <span>
          {score}/{boardColumns * boardRows}
        </span>
      </div>
      <button type="button" onClick={initializeBoard}>
        Restart
      </button>
      <button type="button" onClick={pauseOrResumeGame}>
        Pause/Resume
      </button>
    </div>
  )
}

function Board({ boardColumns, boardRows, ref }: Required<Props>) {
  return (
    <div className={`${baseClass}__board`}>
      <div
        className={`${baseClass}__board__container`}
        style={{
          ...({
            '--board-cols': boardColumns,
            '--board-rows': boardRows,
          } as React.CSSProperties),
        }}
        ref={ref}
        tabIndex={0}
      >
        <div className={`${baseClass}__board-items`}>
          {Array.from({ length: boardColumns * boardRows }).map((_, i) => {
            const cellX = i % boardColumns
            const cellY = Math.floor(i / boardColumns)
            return (
              <div
                key={i}
                className={`${baseClass}__cell`}
                style={{
                  backgroundColor: `var(--cell-${cellX}__${cellY}-color, var(--theme-elevation-100))`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
