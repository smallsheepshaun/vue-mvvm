function Observer (data) {
    this.data = data
    this.walk(data)
}

Observer.prototype = {
    walk: function (data) {
        var me = this
        Object.keys(data).forEach(function (key) {
            me.defineReactive(me.data, key, me.data[key])
        })
    },

    defineReactive: function (data, key, val) {
        var dep = new Dep()
        var childObj = observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                if (Dep.target) {
                    //添加watcher
                    dep.depend()
                }
                return val
            },
            set: function (newVal) {
                if (val == newVal) {
                    return 
                }
                val = newVal

                // 新的值是object的话，进行监听
                childObj = observe(newVal);

                // 通知订阅者
                dep.notify();
            }
        })
    },
}

function observe (val) {
    if (!val || typeof val !== 'object') {
        return 
    }
    return new Observer(val)
}

var uid = 0

function Dep () {
    this.id = uid ++
    this.subs = []
}

Dep.prototype = {
    addSub: function (sub) {
        this.subs.push(sub)
    },

    depend: function () {
        Dep.target.addDep(this)
    },
    
    notify: function () {
        this.subs.forEach(function (sub) {
            sub.update()
        })
    }
}

Dep.target = null