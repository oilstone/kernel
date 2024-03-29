import { Container } from '@oilstone/container';

class Kernel {
    static #CONFIG;

    static #CONTAINER;

    static #hooks = {
        registered: [],
        booted: [],
        die: []
    };

    static getContainer() {
        if (typeof Kernel.#CONTAINER === 'undefined') {
            Kernel.#CONTAINER = Container.make();
        }

        return Kernel.#CONTAINER;
    }

    static configure(config) {
        Kernel.#CONFIG = config;

        return Kernel;
    }

    static registered(callback) {
        return Kernel.hook('registered', callback);
    }

    static booted(callback) {
        return Kernel.hook('booted', callback);
    }

    static die(callback) {
        return Kernel.hook('die', callback);
    }

    static hook(name, callback) {
        this.#hooks[name].push(callback);

        return Kernel;
    }

    static run() {
        Kernel.#CONFIG.providers.forEach(provider => {
            Kernel.getContainer().provide(provider);
        });

        try {
            return Promise.all(this.#hooks.registered.map(callback => {
                return callback();
            })).then(() => {
                return Kernel.getContainer().boot();
            }).then(() => {
                return Promise.all(this.#hooks.booted.map(callback => {
                    return callback();
                }));
            });
        } catch (e) {
            this.#hooks.die.forEach(callback => {
                callback();
            });
        }
    }

    static add(key, value) {
        Kernel.getContainer().add(key, value);

        return Kernel;
    }

    static resolve(key) {
        return Kernel.getContainer().resolve(key);
    }
}

export default Kernel;
