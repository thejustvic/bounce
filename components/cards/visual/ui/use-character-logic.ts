/* eslint-disable max-depth */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import {useFrame, useThree} from '@react-three/fiber'
import type {RapierRigidBody} from '@react-three/rapier'
import {RefObject, useMemo, useRef, useState} from 'react'
import {isMobile} from 'react-device-detect'
import {Euler, Group, PerspectiveCamera, Vector3} from 'three'
import {PlayerSizeType} from '../../types'
import {usePlayerControls} from '../utils/helpers'
import {useCarEngineSound} from './use-car-engine-sound'

const JUMP_PREP_DURATION = 0.2 // 200ms time for jump-start animation
const DOUBLE_CLICK_WINDOW = 0.25 // 250ms time between the first and second click
const THRUST_DELAY = 0.25 // 250ms delay before activating up thrust
const GROUNDED_THRESHOLD = 0.1 // vertical speed threshold for ground

// side camera view
const CAMERA_OFFSET = new Vector3(1, 0, 4) // x: sideways, y: up, z: back
const CAR_CAMERA_OFFSET = new Vector3(0, 0.6, 5) // x: sideways, y: up, z: back

// temporary variables outside the renderer to avoid Garbage Collection
const _tempVec = new Vector3()
const _tempEuler = new Euler()
const _tempOffset = new Vector3()
const _tempTargetCam = new Vector3()

export type HeadPointType = {y: number; z: number}

export interface CarTelemetry {
  currentSpeed: number
  currentSteer: number
  acceleration: number
}

interface CharacterLogicProps {
  rigidBodyRef: RefObject<RapierRigidBody | null>
  visualRef: RefObject<Group | null>
  movement: {
    moveData: RefObject<{x: number; y: number}>
    lookData: RefObject<{x: number; y: number}>
  }
  characteristics: {
    is3DSceneLocked: boolean
    smoothnessFactor: number
    isThirdPersonView: boolean
    speed: number
    headPoint: HeadPointType
    jumpForce: number
    playerSize: PlayerSizeType[number]
  }
}

export interface ModelCharacteristics {
  isThirdPersonView: boolean
  is3DSceneLocked: boolean
  isFlying: boolean
  isJumping: boolean
  isFalling: boolean
  isPreparingJump: boolean
  justDropped: boolean
  speed: number
  carTelemetryRef: RefObject<CarTelemetry>
}

export const useCharacterLogic = (
  props: CharacterLogicProps
): ModelCharacteristics => {
  const {rigidBodyRef, visualRef, movement, characteristics} = props
  const {moveData, lookData} = movement
  const {
    is3DSceneLocked,
    smoothnessFactor,
    isThirdPersonView,
    speed,
    headPoint,
    jumpForce,
    playerSize
  } = characteristics
  const {updateEngineSound} = useCarEngineSound(
    playerSize === 'car' && !is3DSceneLocked
  )
  const controls = usePlayerControls({is3DSceneLocked})
  const {camera} = useThree()

  const [isPreparingJump, setIsPreparingJump] = useState(false)

  // animation states
  const [isJumping, setIsJumping] = useState(false)
  const [isFalling, setIsFalling] = useState(false)

  const isFlying = useRef(false)
  const wasFlying = useRef(false) // flight status in the last frame
  const lastJumpTime = useRef(0)
  const jumpPressed = useRef(false)
  const jumpTargetTime = useRef<number | null>(null)

  const carYaw = useRef(0)
  const currentSpeed = useRef(0)
  const currentSteer = useRef(0)
  const carTelemetryRef = useRef<CarTelemetry>({
    currentSpeed: 0,
    currentSteer: 0,
    acceleration: 0
  })
  const kickTimer = useRef(0) // effect progress from 0 to 1 (0 = inactive)
  const wasStopped = useRef(true) // was the car parked before this?

  // cache vectors so they don't have to be created 60 times per second
  const v = useMemo(
    () => ({
      direction: new Vector3(),
      front: new Vector3(),
      side: new Vector3(),
      targetVel: new Vector3()
    }),
    []
  )

  const cameraOffset = useMemo(() => {
    return playerSize === 'car' ? CAR_CAMERA_OFFSET : CAMERA_OFFSET
  }, [playerSize])

  useFrame((state, rawDelta) => {
    const body = rigidBodyRef.current
    if (!body) {
      return
    }

    // protection against delta = 0 or massive jumps when collapsing a tab
    const delta = Math.min(Math.max(rawDelta, 0.001), 0.1)
    const flyingNow = isFlying.current

    const time = state.clock.getElapsedTime()

    // 'flight mode' exit detection
    if (wasFlying.current && !flyingNow) {
      const vel = body.linvel()
      body.setLinvel({x: vel.x * 0.5, y: -2, z: vel.z * 0.5}, true)
    }

    // 'flight mode' entry detection
    if (!wasFlying.current && flyingNow) {
      body.setLinvel({x: 0, y: 0, z: 0}, true)
    }

    // turn processing (looking)
    if (!is3DSceneLocked) {
      _tempEuler.setFromQuaternion(camera.quaternion, 'YXZ')

      if (isMobile) {
        // mobile joystick: works as velocity
        // factor of 2-3 is usually better for a joystick
        _tempEuler.y -= lookData.current.x * 2 * delta
        _tempEuler.x -= lookData.current.y * 2 * delta
      } else {
        // for desktop: use a constant multiplier for smoothness
        const sensitivity = 0.1
        _tempEuler.y -= lookData.current.x * sensitivity
        _tempEuler.x -= lookData.current.y * sensitivity

        // decay mouse only
        const lookDecay = Math.exp(-smoothnessFactor * delta)
        lookData.current.x *= lookDecay
        lookData.current.y *= lookDecay
      }

      const angleView = isThirdPersonView ? 0.15 : Math.PI / 2
      // limit gaze up/down so you don't "fall over"
      _tempEuler.x = Math.max(-Math.PI / 2, Math.min(angleView, _tempEuler.x))

      const isDriving = Math.abs(currentSpeed.current) > 0.5
      const isMouseIdle =
        Math.abs(lookData.current.x) < 0.01 &&
        Math.abs(lookData.current.y) < 0.01

      if (playerSize === 'car' && isDriving && isMouseIdle) {
        const targetCamYaw = carYaw.current + Math.PI
        const diff = Math.atan2(
          Math.sin(targetCamYaw - _tempEuler.y),
          Math.cos(targetCamYaw - _tempEuler.y)
        )
        _tempEuler.y += diff * (1 - Math.exp(-3.0 * delta))
      }

      // apply changes to the camera
      camera.quaternion.setFromEuler(_tempEuler)
    }

    // movement physics (if the scene is not locked)
    if (is3DSceneLocked) {
      body.setLinvel({x: 0, y: 0, z: 0}, true)
    } else if (playerSize === 'car') {
      const {forward, backward, left, right} = controls

      const throttleInput =
        moveData.current.y !== 0
          ? moveData.current.y
          : Number(forward) - Number(backward)

      const steerInput =
        moveData.current.x !== 0
          ? moveData.current.x
          : Number(left) - Number(right)

      const maxSpeed = speed
      const maxReverseSpeed = speed * 0.5
      const targetSpeed =
        throttleInput > 0
          ? throttleInput * maxSpeed
          : throttleInput * maxReverseSpeed

      const accelRate = throttleInput !== 0 ? 4.0 : 0.5
      const prevSpeed = currentSpeed.current
      currentSpeed.current +=
        (targetSpeed - currentSpeed.current) *
        (1 - Math.exp(-accelRate * delta))

      const instantAccel = (currentSpeed.current - prevSpeed) / delta

      const maxSteerAngle = 0.65
      currentSteer.current +=
        (steerInput * maxSteerAngle - currentSteer.current) *
        (1 - Math.exp(-10 * delta))

      const speedRatio = Math.min(
        Math.abs(currentSpeed.current) / Math.max(maxSpeed * 0.25, 0.01),
        1
      )
      const reverseSign = currentSpeed.current >= -0.05 ? 1 : -1
      const turnSpeed = 2.8

      carYaw.current +=
        currentSteer.current * turnSpeed * speedRatio * reverseSign * delta

      carTelemetryRef.current.currentSpeed = currentSpeed.current
      carTelemetryRef.current.currentSteer = currentSteer.current
      carTelemetryRef.current.acceleration = instantAccel

      const engineSpeedRatio =
        Math.abs(currentSpeed.current) / Math.max(maxSpeed, 0.01)
      const isThrottling = Math.abs(throttleInput) > 0.05

      // calculation of slippage force (from 0 to 1)
      let skidAmount = 0

      // situation A: wheel spin at the start (pressing the gas while speed is still low)
      if (isThrottling && engineSpeedRatio < 0.35) {
        skidAmount = Math.max(skidAmount, (1 - engineSpeedRatio / 0.35) * 0.85)
      }

      // situation B: sudden braking or a U-turn (direction of acceleration opposite to the direction of motion)
      if (
        (throttleInput > 0.1 && currentSpeed.current < -0.5) ||
        (throttleInput < -0.1 && currentSpeed.current > 0.5)
      ) {
        skidAmount = 1.0
      }

      // situation C: tire squeal/hissing during a sharp turn at high speed
      const steerRatio = Math.abs(currentSteer.current) / maxSteerAngle
      if (engineSpeedRatio > 0.45 && steerRatio > 0.6) {
        const cornerSkid =
          ((engineSpeedRatio - 0.45) / 0.55) * ((steerRatio - 0.6) / 0.4)
        skidAmount = Math.max(skidAmount, cornerSkid * 0.9)
      }

      updateEngineSound(engineSpeedRatio, isThrottling, skidAmount)

      body.setRotation(
        {
          x: 0,
          y: Math.sin(carYaw.current / 2),
          z: 0,
          w: Math.cos(carYaw.current / 2)
        },
        true
      )

      const forwardX = Math.sin(carYaw.current)
      const forwardZ = Math.cos(carYaw.current)
      const currentVel = body.linvel()

      body.setLinvel(
        {
          x: forwardX * currentSpeed.current,
          y: currentVel.y,
          z: forwardZ * currentSpeed.current
        },
        true
      )
    } else {
      // the logic of an ordinary character
      const {forward, backward, left, right} = controls
      const inputX =
        moveData.current.x !== 0
          ? moveData.current.x
          : Number(left) - Number(right)
      const inputZ =
        moveData.current.y !== 0
          ? -moveData.current.y
          : Number(backward) - Number(forward)

      v.front.set(0, 0, inputZ)
      v.side.set(inputX, 0, 0)

      // get the direction relative to the camera with save normalization
      v.direction.subVectors(v.front, v.side)
      if (v.direction.lengthSq() > 0) {
        v.direction.normalize().applyQuaternion(camera.quaternion)
      }

      // reset Y so that looking up/down does not affect horizontal speed
      if (!isFlying.current) {
        v.direction.y = 0
        if (v.direction.lengthSq() > 0) {
          v.direction.normalize()
        }
      }

      // re-normalize, because after removing Y the length of the vector has changed
      v.direction.normalize()

      // jumping and flight logic
      const currentVelocity = body.linvel()
      const strength = Math.min(Math.sqrt(inputX * inputX + inputZ * inputZ), 1)
      const vy = currentVelocity.y
      const grounded = Math.abs(vy) < GROUNDED_THRESHOLD
      const {jump} = controls

      // jumping verification
      if (jump && !jumpPressed.current) {
        jumpPressed.current = true
        const timeSinceLastJump = time - lastJumpTime.current

        // double jump verification
        if (
          timeSinceLastJump > 0.01 &&
          timeSinceLastJump < DOUBLE_CLICK_WINDOW
        ) {
          isFlying.current = !isFlying.current
          body.setGravityScale(isFlying.current ? 0 : 1, true)

          if (isFlying.current) {
            body.setLinvel(
              {x: currentVelocity.x, y: 0, z: currentVelocity.z},
              true
            )
          }

          jumpTargetTime.current = null
          setIsPreparingJump(false)
          lastJumpTime.current = 0
        } else {
          // this is the first jump
          lastJumpTime.current = time

          if (grounded && !isFlying.current) {
            jumpTargetTime.current = time + JUMP_PREP_DURATION
            setIsPreparingJump(true)
          }
        }
      }

      if (!jump) {
        jumpPressed.current = false
      }

      // calculation of vertical velocity
      let targetY = isFlying.current ? v.direction.y * speed * strength : vy

      // thrust
      if (
        isFlying.current &&
        jump &&
        time - lastJumpTime.current > THRUST_DELAY
      ) {
        targetY = speed
      }

      // logic of preparing for the jump
      if (jumpTargetTime.current !== null) {
        if (time >= jumpTargetTime.current) {
          targetY = jumpForce
          jumpTargetTime.current = null
          setIsPreparingJump(false)
          setIsJumping(true)
        } else {
          targetY = 0
        }
      }

      // application of speed
      v.targetVel.set(
        v.direction.x * speed * strength,
        targetY,
        v.direction.z * speed * strength
      )

      body.setLinvel(v.targetVel, true)

      const characterY = body.translation().y // the height at which the character is located

      // animation state updates
      if (!isFlying.current && jumpTargetTime.current === null) {
        const jumping = vy > 0.5

        // fall: down speed + height check (e.g. > 0.5 from ground)
        // use current character Y position (characterY)
        const falling = vy < -0.5 && characterY > 0.5

        if (isJumping !== jumping) {
          setIsJumping(jumping)
        }
        if (isFalling !== falling) {
          setIsFalling(falling)
        }
      } else {
        if (isJumping) {
          setIsJumping(false)
        }
        if (isFalling) {
          setIsFalling(false)
        }
      }
    }

    // update the ref for detection in the next frame
    wasFlying.current = isFlying.current
    // camera position — always at the end of useFrame
    // camera position — we take it from the interpolated visualRef!
    if (visualRef?.current) {
      visualRef.current.getWorldPosition(_tempVec)
    } else {
      const bodyPos = body.translation()
      // determine the "headPoint" point (center of the body + upward movement)
      // y + headPoint: this offset raises the camera from the center of the capsule to the top. if the camera is too low, increase headPoint
      _tempVec.set(bodyPos.x, bodyPos.y + headPoint.y, bodyPos.z + headPoint.z)
    }

    _tempVec.y += headPoint?.y ?? 0
    _tempVec.z += headPoint?.z ?? 0
    if (isThirdPersonView) {
      _tempOffset.copy(cameraOffset).applyQuaternion(camera.quaternion)
      _tempTargetCam.addVectors(_tempVec, _tempOffset)

      if (playerSize === 'car') {
        // for the car, establish a rigid link to the model's interpolated position (zero jitter!)
        camera.position.copy(_tempTargetCam)

        if (camera instanceof PerspectiveCamera) {
          const baseFov = 50 // your base FOV
          const maxKickFov = 8 // soft expansion (6–8 degrees produces a very subtle effect)
          const KICK_DURATION = 1.1 // total duration in seconds

          const absSpeed = Math.abs(currentSpeed.current)

          // start the timer when moving off from a standstill
          if (wasStopped.current && currentSpeed.current > 0.5) {
            kickTimer.current = 0.001 // starting progress
            wasStopped.current = false
          }

          if (absSpeed < 0.2) {
            wasStopped.current = true
          }

          let smoothWave = 0

          if (kickTimer.current > 0) {
            kickTimer.current += delta / KICK_DURATION

            if (kickTimer.current >= 1) {
              kickTimer.current = 0
            } else {
              // transforming linear time (0 -> 1) into a smooth arc (0 -> 1 -> 0)
              // Math.pow(..., 0.7) shifts the peak slightly closer to the start (~0.35 sec) and makes the return longer
              const curvedProgress = Math.pow(kickTimer.current, 0.7)
              smoothWave = Math.sin(curvedProgress * Math.PI)
            }
          }

          const targetFov = baseFov + maxKickFov * smoothWave

          if (Math.abs(camera.fov - targetFov) > 0.005) {
            // smooth catching up without sudden jumps
            camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-8 * delta))
            camera.updateProjectionMatrix()
          }
        }
        // if the position difference is huge (e.g. teleport), copy instantly
      } else if (camera.position.distanceToSquared(_tempTargetCam) > 100) {
        camera.position.copy(_tempTargetCam)
      } else {
        // exponential smoothing (smoothness factor)
        camera.position.lerp(
          _tempTargetCam,
          1 - Math.exp(-smoothnessFactor * delta)
        )
      }
    } else {
      camera.position.copy(_tempVec)
    }
  })
  return {
    isThirdPersonView,
    is3DSceneLocked,
    isFlying: isFlying.current,
    isJumping,
    isFalling,
    isPreparingJump,
    justDropped: wasFlying.current && !isFlying.current,
    speed,
    carTelemetryRef
  }
}
