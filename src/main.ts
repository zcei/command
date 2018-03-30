import * as Config from '@oclif/config'
import Help from '@oclif/plugin-help'

import {Command, flags} from '.'

export class Main extends Command {
  static flags = {
    version: flags.version(),
    help: flags.help(),
  }

  static run(argv = process.argv.slice(2), options?: Config.LoadOptions) {
    return super.run(argv, options || module.parent && module.parent.parent && module.parent.parent.filename || __dirname)
  }

  async init() {
    let [id, ...argv] = this.argv
    await this.config.runHook('init', {id, argv})
    await super.init()
  }

  async run() {
    const {id, argv} = this.parseCommandFromArgv()

    this.parse({strict: false, '--': false, ...this.ctor as any})
    if (!this.config.findCommand(id)) {
      const topic = this.parseTopicFromArgv()

      if (topic) return this._helpTopic(topic)
    }
    await this.config.runCommand(id, argv)
  }

  protected _helpOverride(): boolean {
    if (['-v', '--version', 'version'].includes(this.argv[0])) return this._version() as any
    if (['-h', 'help'].includes(this.argv[0])) return true
    if (this.argv.length === 0) return true
    for (let arg of this.argv) {
      if (arg === '--help') return true
      if (arg === '--') return false
    }
    return false
  }

  protected parseCommandFromArgv(): { id: string, argv: string[] } {
    let [id, ...argv] = this.argv

    let currentCommandPortions = [id]
    let arg

    while (arg = argv.shift()) {
      currentCommandPortions = [...currentCommandPortions, arg]
      const currentCommandId = currentCommandPortions.join(':')

      if (this.config.findCommand(currentCommandId)) {
        id = currentCommandId
        break
      }
    }

    return {id, argv}
  }

  protected parseTopicFromArgv(): Config.Topic | undefined {
    let [...argv] = this.argv

    let topic
    while (argv.length) {
      const currentTopic = argv.join(':')
      topic = this.config.findTopic(currentTopic)

      if (topic) {
        break
      }

      argv.pop()
    }

    return topic
  }

  protected _helpTopic(topic: Config.Topic) {
    const HHelp: typeof Help = require('@oclif/plugin-help').default
    const help = new HHelp(this.config)
    help.showHelp([topic.name])
    this.exit(0)
  }

  protected _help() {
    const HHelp: typeof Help = require('@oclif/plugin-help').default
    const help = new HHelp(this.config)
    help.showHelp(this.argv)
    this.exit(0)
  }
}

export function run(argv = process.argv.slice(2), options?: Config.LoadOptions) {
  return Main.run(argv, options)
}
