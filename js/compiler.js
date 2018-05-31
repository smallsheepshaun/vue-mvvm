function Compiler (el, vm) {
    this.$vm = vm
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)

    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el)
        this.init()
        this.$el.appendChild(this.$fragment)
    }
}

Compiler.prototype = {
    /**
     * node节点转文档碎片 减少dom操作 提升性能
     */
    node2Fragment: function (el) {
        var fragment = document.createDocumentFragment(),
            child

        //遍历node节点  appendChild移除拷贝到文档碎片
        while(child = el.firstChild) {
            fragment.appendChild(child)
        }
        return fragment
    },

    /**
     * 初始化文档碎片
     */
    init: function () {
        this.compilerElement(this.$fragment)
    },

    /**
     * 文档碎片分类处理
     */
    compilerElement: function (el) {
        var childNodes = el.childNodes,
            me = this
        Array.prototype.slice.call(childNodes).forEach(function (node) {
            var text = node.textContent,
            reg = /\{\{(.*)\}\}/

            /**
             * 如果为node节点
             */
            if (me.isElementNode(node)) {
                me.compile(node)
            }

            /**
             * 如果为文本节点且为{{xxxx}}形式
             */
            else if (me.isTextNode(node) && reg.test(text)) {
                //RegExp.$1 为 {{}} 中的内容 即绑定值
                me.compileText(node, RegExp.$1)
            } 
            /**
             * 如果包含子节点 递归
             */
            if (node.childNodes && node.childNodes.length) {
                me.compilerElement(node)
            }
        })
    },


    /**
     * 是否为文本节点
     */
    isTextNode: function (node) {
        return node.nodeType == 3
    },

    /**
     * 是否为node节点
     */
    isElementNode: function (node) {
        return node.nodeType == 1
    },

    /**
     * node节点处理
     */
    compile: function (node) {
        var nodeAttrs = node.attributes,
            me = this
        Array.prototype.slice.call(nodeAttrs).forEach(function (attr) {
            var attrName = attr.name
            //如果为 v- 开头的属性 
            if(me.isDirective(attrName)) {
                /** 
                 * v-model=aaa
                 * exp: aaa
                 * dir: model
                 */
                var exp = attr.value,
                    dir = attrName.substring(2)
                //事件指令
                if (me.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, me.$vm, exp, dir)
                    //普通指令
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp)
                }
                //去除dom中v-属性
                node.removeAttribute(attrName)
            }
        })

    },

    /**
     * 绑定文本节点（{{xxxx}}）处理
     */
    compileText: function (node, exp) {
        compileUtil.text(node, this.$vm, exp)
    },

    /**
     * 是否为指令
     */
    isDirective: function (attr) {
        return attr.indexOf('v-') == 0
    },

    /**
     * 是否为事件指令
     */
    isEventDirective: function (dir) {
        return dir.indexOf('on') == 0
    },



}

//指令处理合集
var compileUtil = {
    //html处理
    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html')
    },

    //文本处理
    text: function (node, vm, exp) {
        this.bind(node, vm, exp, 'text')
    },

    //model绑定处理
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model')
        var me = this,
            val = this._getVMVal(vm, exp)
        
        node.addEventListener('input', function (e) {
            var newValue = e.target.value
            if (val === newValue) {
                return 
            } else {
                me._setVMVal(vm, exp, newValue)
                /**
                 * 利用闭包缓存val值,以便后续比较
                 */
                val = newValue
            }
        })
    },

    //bind统一普通属性处理
    bind: function (node, vm, exp, dir) {
        var updaterFn = updater[dir + 'Updater']
        updaterFn && updaterFn(node, this._getVMVal(vm, exp))

        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue)
        })
    },

    //事件处理
    eventHandler: function (node ,vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false)
        }
    },

    //获取value值
    _getVMVal: function (vm, exp) {
        //贼jer有趣 获取val值
        var val = vm
        exp = exp.split('.')
        exp.forEach(function (key) {
            val = val[key]
        })
        return val
    },

    //设置value值
    _setVMVal: function (vm, exp, value) {
        //这个也贼jer有趣
        var val = vm 
        exp = exp.split('.')
        exp.forEach(function (key, idx) {
            if (idx < exp.length -1) {
                val = val[key]
            } else {
                val[key] = value
            }
           
        })
        
    }
}

//view更新
var updater = {
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value
    },

    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value
    },

    modelUpdater: function (node, value) {
        node.value = typeof value == 'undefined' ? '' : value
    }
}