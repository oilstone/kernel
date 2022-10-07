import Container from '@oilstone/container';

class Kernel {
    static #CONFIG;

    static #CONTAINER;

    static #hooks = {
        registered: [],
        booted: [],
        die: []
    };

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
        Kernel.#CONTAINER = Container.make();

        Kernel.#CONFIG.providers.forEach(provider => {
            Kernel.#CONTAINER.provide(provider);
        });

        try {
            return Promise.all(this.#hooks.registered.map(callback => {
                return callback();
            })).then(() => {
                Kernel.#CONTAINER.boot();

                return true;
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
        Kernel.#CONTAINER.add(key, value);

        return Kernel;
    }

    static resolve(key) {
        return Kernel.#CONTAINER.resolve(key);
    }
}

export default Kernel;
