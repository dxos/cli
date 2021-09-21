import { cmd } from "./cli"
import { promises as fs } from "fs"
import { join } from 'path'
import expect from 'expect'

const PROFILE_NAME = `e2e-test`

describe('CLI', () => {

  it('--help', async () => {
    await cmd('--help').run()
  })

  describe('profile', () => {
    it('init', async () => {
      try {
        await fs.rm(join(process.env.HOME!, '.wire/profile', `${PROFILE_NAME}.yml`))
      } catch {}

      await cmd(`profile init --name ${PROFILE_NAME} --template-url https://git.io/JBQdM`).debug().run()
    })

    it('select profile', async () => {
      await cmd(`profile set ${PROFILE_NAME}`).run()
    })

    it('config', async () => {
      await cmd('profile config').json()
    })
  })

  describe('data', () => {
    it('party create', async () => {
      const { party } = await cmd(`party create --json`).json<{ party: string }>()
      expect(typeof party).toBe('string')
    })

    it('party list', async () => {
      const parties = await cmd(`party list --json`).json()
      expect(Array.isArray(parties)).toBe(true)
      expect(parties.length).toBeGreaterThanOrEqual(1)
    })
  })
})
