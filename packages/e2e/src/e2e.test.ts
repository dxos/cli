import { cmd } from "./cli"
import { randomBytes } from 'crypto'
import { promises as fs } from "fs"
import { join } from 'path'

const randomId = () => randomBytes(8).toString('hex')

const PROFILE_NAME = `e2e-test`

describe('CLI', () => {

  it('--help', async () => {
    await cmd('--help').run()
  })

  describe('profile', () => {
    it.only('init', async () => {
      try {
        await fs.rm(join(process.env.HOME!, '.wire/profile', `${PROFILE_NAME}.yml`))
      } catch {}

      await cmd(`profile init --name ${PROFILE_NAME} --template-url https://git.io/JBQdM`).debug().run()
    })

    it.only('select profile', async () => {
      await cmd(`profile set ${PROFILE_NAME}`).run()
    })

    it('config', async () => {
      await cmd('profile config').json()
    })
  })

  describe('data', () => {
    it('foo')
  })
})
