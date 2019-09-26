class Observable {
    constructor() {
        this.observers = new Set();
        this.observerMap = new Map();
        this.changed = false;
    }

    addObserver(observer) {
        this.observers.add(observer);
        this.observerMap.set(observer.element.id, observer);
    }

    getObserverByID(id) {
        return this.observerMap.get(id);
    }

    countObservers() {
        return this.observers.size;
    }

    deleteObserver(observer) {
        this.observers.delete(observer);
    }

    hasChanged() {
        return this.changed;
    }

    setChanged() {
        this.changed = true;
        this.notifyObservers.apply(null, arguments);
    }

    clearChanged() {
        this.changed = false;
    }

    notifyObservers() {
        this.observers.forEach((observer) => observer.notify.apply(null, arguments));
        this.clearChanged();
    }

    notifyObserver(observer) {
        observer.notify.apply(null, arguments);
    }

    notifyObserverByID(isWidth, size, element) {
        this.observers.forEach(observer => {
           if(observer && element.contains(observer.element)) {
               observer.notify.apply(observer, arguments);
           }
        });
    }
}

module.exports = Observable;