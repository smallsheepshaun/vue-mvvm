根据vue源码及网上大神解析， 完成此demo


obverser.js 为数据变动的劫持，get处监听 set处触发view更新


compiler.js 为解析器，解析dom中各属性及指令类型，并设置view视图更新， 并移除DOM v-属性


watcher.js  监听器 obverser compiler枢纽，obverser get中设置监听， set中触发监听


mvvm.js     整个vue实例入口
