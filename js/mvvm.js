/**
 * 初始化MVVM
 * 赋值this._data供 prototype调用
 */
function MVVM (options) {
    this.$options = options || {}
    var data = this._data = this.$options.data
    
    var me = this

    /**
     * 将vm对象遍历添加data相应Key属性
     */
    Object.keys(data).forEach(function (key) {
        me._proxyData(key)
    })

    this._initComputed();

    //劫持监听属性
    observe(data)

    //实例化解析器
    this.$compiler = new Compiler(options.el || document.body, this)
}

MVVM.prototype = {
    
    /**
     * 代理转化, this.data.xxx -> this.xxx
     * 取值及设置属性内容 实质为操作vm.data下相应key值
     */
    _proxyData: function (key) {
        var me = this
        Object.defineProperty(me, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                return me._data[key]
            },
            set: function (newVal) {
                me._data[key] = newVal
            }
        })
    },

    /**
     * 初始化computed
     */
    _initComputed: function () {
        var me = this
        var computed = this.$options.computed
        /**
         * 遍历computed 绑定vm下, computed[key]非fn自调用get
         */
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(key => {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] == 'function'
                            ? computed[key]
                            : computed[key].get
                })
            })
        }
    },
    
    /**
     * $watch
     */
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },
}