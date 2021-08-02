
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var Bodotika = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function expoIn(t) {
        return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function expoOut(t) {
        return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/Insta_logo.svelte generated by Svelte v3.38.3 */
    const file$8 = "src/Insta_logo.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let canvas_1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "width", 32);
    			attr_dev(canvas_1, "height", 32);
    			attr_dev(canvas_1, "class", "svelte-1flit6x");
    			add_location(canvas_1, file$8, 40, 0, 1113);
    			attr_dev(div, "class", "svelte-1flit6x");
    			add_location(div, file$8, 39, 0, 1107);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[1](canvas_1);

    			if (!mounted) {
    				dispose = listen_dev(canvas_1, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[1](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Insta_logo", slots, []);
    	let canvas;

    	onMount(() => {
    		const ctx = canvas.getContext("2d");
    		let frame;

    		(function loop() {
    			frame = requestAnimationFrame(loop);
    			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    			for (let p = imageData.data.length; p > 0; p -= 4) {
    				const i = p / 4;
    				const x = i % canvas.width;
    				const y = i / canvas.height >>> 0;
    				const t = window.performance.now();
    				const r = 64 + 128 * x / canvas.width + 128 * Math.sin(t / 1000);
    				const g = 64 + 128 * y / canvas.height + 128 * Math.cos(t / 1400);
    				const b = 128;
    				imageData.data[p + 0] = r;
    				imageData.data[p + 1] = g;
    				imageData.data[p + 2] = b;
    				imageData.data[p + 3] = 178;
    			}

    			ctx.putImageData(imageData, 0, 0);
    		})();

    		return () => {
    			cancelAnimationFrame(frame);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Insta_logo> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	const click_handler = () => {
    		window.open("https://www.instagram.com/instabodotika/");
    	};

    	$$self.$capture_state = () => ({ onMount, canvas });

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, canvas_1_binding, click_handler];
    }

    class Insta_logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Insta_logo",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Title.svelte generated by Svelte v3.38.3 */
    const file$7 = "src/Title.svelte";

    // (61:4) {:else}
    function create_else_block(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let span0;
    	let span1;
    	let t2;
    	let div1;
    	let span2;
    	let i;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*clicked*/ ctx[0] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Bodotika";
    			span1 = element("span");
    			span1.textContent = "Bureau de création et d'édition";
    			t2 = space();
    			div1 = element("div");
    			span2 = element("span");
    			i = element("i");
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "svelte-yzb6yx");
    			add_location(span0, file$7, 64, 24, 2282);
    			attr_dev(span1, "class", "svelte-yzb6yx");
    			add_location(span1, file$7, 64, 45, 2303);
    			attr_dev(h1, "class", "svelte-yzb6yx");
    			add_location(h1, file$7, 64, 20, 2278);
    			attr_dev(div0, "class", "title col svelte-yzb6yx");
    			add_location(div0, file$7, 63, 16, 2234);
    			attr_dev(i, "class", "fa fa-bars svelte-yzb6yx");
    			add_location(i, file$7, 68, 24, 2523);
    			attr_dev(span2, "class", "icon");
    			add_location(span2, file$7, 67, 20, 2441);
    			attr_dev(div1, "class", "col MobileMenu svelte-yzb6yx");
    			add_location(div1, file$7, 66, 16, 2392);
    			attr_dev(div2, "class", "row align-items-center");
    			add_location(div2, file$7, 62, 12, 2181);
    			attr_dev(div3, "class", "container");
    			set_style(div3, "padding-bottom", "0");
    			add_location(div3, file$7, 61, 8, 2119);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, span0);
    			append_dev(h1, span1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(span2, i);
    			append_dev(div3, t3);
    			if (if_block) if_block.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*clicked*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*clicked*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(61:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:4) {#if screen_width > 575}
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let span0;
    	let span1;
    	let span2;
    	let t2;
    	let b;
    	let t4;
    	let t5;
    	let div1;
    	let insta_logo;
    	let t6;
    	let span3;
    	let current;
    	let mounted;
    	let dispose;
    	insta_logo = new Insta_logo({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Bodotika";
    			span1 = element("span");
    			span1.textContent = "Bureau de création et d'édition _\n                ";
    			span2 = element("span");
    			t2 = text("Avignon ");
    			b = element("b");
    			b.textContent = "/";
    			t4 = text(" Saint-Etienne");
    			t5 = space();
    			div1 = element("div");
    			create_component(insta_logo.$$.fragment);
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "Contact";
    			attr_dev(span0, "class", "svelte-yzb6yx");
    			add_location(span0, file$7, 50, 29, 1610);
    			attr_dev(span1, "class", "svelte-yzb6yx");
    			add_location(span1, file$7, 50, 50, 1631);
    			set_style(b, "font-weight", "500");
    			set_style(b, "color", "rgba(0, 0, 0, 0.78)");
    			set_style(b, "font-size", "11px");
    			add_location(b, file$7, 51, 37, 1708);
    			attr_dev(span2, "class", "svelte-yzb6yx");
    			add_location(span2, file$7, 51, 23, 1694);
    			attr_dev(h1, "class", " svelte-yzb6yx");
    			add_location(h1, file$7, 50, 16, 1597);
    			attr_dev(div0, "class", "title col-auto mr-auto svelte-yzb6yx");
    			add_location(div0, file$7, 49, 12, 1544);
    			attr_dev(span3, "class", "underline svelte-yzb6yx");
    			set_style(span3, "font-size", "14px");
    			set_style(span3, "font-weight", "500");
    			add_location(span3, file$7, 55, 16, 1940);
    			attr_dev(div1, "class", "col-auto d-flex align-items-center");
    			add_location(div1, file$7, 53, 12, 1845);
    			attr_dev(div2, "class", "align-items-center contain svelte-yzb6yx");
    			add_location(div2, file$7, 48, 8, 1491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, span0);
    			append_dev(h1, span1);
    			append_dev(h1, span2);
    			append_dev(span2, t2);
    			append_dev(span2, b);
    			append_dev(span2, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			mount_component(insta_logo, div1, null);
    			append_dev(div1, t6);
    			append_dev(div1, span3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span3, "click", /*On_copie*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(insta_logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(insta_logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(insta_logo);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(48:4) {#if screen_width > 575}",
    		ctx
    	});

    	return block;
    }

    // (73:12) {#if clicked}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let div1;
    	let span2;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Contact";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "|";
    			t3 = space();
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "Instagram";
    			add_location(span0, file$7, 76, 24, 2930);
    			attr_dev(div0, "class", "MobileLinks col svelte-yzb6yx");
    			set_style(div0, "text-align", "left");
    			add_location(div0, file$7, 75, 20, 2850);
    			set_style(span1, "line-height", "1");
    			set_style(span1, "font-size", "15px");
    			set_style(span1, "color", "rgba(0, 0, 0, 0.88)");
    			add_location(span1, file$7, 78, 20, 3018);
    			add_location(span2, file$7, 80, 24, 3202);
    			attr_dev(div1, "class", "MobileLinks col svelte-yzb6yx");
    			set_style(div1, "text-align", "right");
    			add_location(div1, file$7, 79, 20, 3121);
    			attr_dev(div2, "class", "row MobileRow py-3 svelte-yzb6yx");
    			add_location(div2, file$7, 73, 16, 2662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div2, t1);
    			append_dev(div2, span1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", /*On_copie*/ ctx[4], false, false, false),
    					listen_dev(span2, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, slide, { delay: 0, duration: 500, easing: expoOut });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, slide, { delay: 0, duration: 250, easing: expoIn });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(73:12) {#if clicked}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#if copied}
    function create_if_block$1(ctx) {
    	let div;
    	let p;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = `${/*copied_msg*/ ctx[3]}`;
    			set_style(p, "text-align", "justify");
    			add_location(p, file$7, 90, 16, 3597);
    			attr_dev(div, "class", "copied align-self-end svelte-yzb6yx");
    			add_location(div, file$7, 88, 12, 3451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 200, duration: 1000 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 500, delay: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(88:4) {#if copied}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*screen_width*/ ctx[2] > 575) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*copied*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-yzb6yx");
    			add_location(main, file$7, 46, 0, 1447);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block0.p(ctx, dirty);

    			if (/*copied*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*copied*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const str = "bonjour@bodotika.fr";

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, []);
    	let clicked = false;
    	let copied = false;
    	const screen_width = window.innerWidth > 0 ? window.innerWidth : screen.width;

    	const copied_msg = screen_width > 575
    	? "\"bonjour@bodotika.fr\" a été copié dans votre presse-papiers."
    	: "\"bonjour@bodotika.fr\" a été copié avec succès.";

    	const copyToClipboard = str => {
    		const el = document.createElement("textarea");
    		el.value = str;
    		el.setAttribute("readonly", "");
    		el.style.position = "absolute";
    		el.style.left = "-9999px";
    		document.body.appendChild(el);

    		const selected = document.getSelection().rangeCount > 0
    		? document.getSelection().getRangeAt(0)
    		: false;

    		el.select();
    		document.execCommand("copy");
    		document.body.removeChild(el);

    		if (selected) {
    			document.getSelection().removeAllRanges();
    			document.getSelection().addRange(selected);
    		}
    	};

    	function On_copie() {
    		if (copied) return;
    		$$invalidate(1, copied = !copied);
    		copyToClipboard(str);

    		setTimeout(
    			() => {
    				$$invalidate(1, copied = !copied);
    			},
    			2500
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, clicked = !clicked);
    	};

    	const click_handler_1 = () => {
    		window.open("https://www.instagram.com/instabodotika/");
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		expoIn,
    		expoOut,
    		fly,
    		fade,
    		Insta_logo,
    		clicked,
    		copied,
    		str,
    		screen_width,
    		copied_msg,
    		copyToClipboard,
    		On_copie
    	});

    	$$self.$inject_state = $$props => {
    		if ("clicked" in $$props) $$invalidate(0, clicked = $$props.clicked);
    		if ("copied" in $$props) $$invalidate(1, copied = $$props.copied);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		clicked,
    		copied,
    		screen_width,
    		copied_msg,
    		On_copie,
    		click_handler,
    		click_handler_1
    	];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Devise.svelte generated by Svelte v3.38.3 */

    const file$6 = "src/Devise.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let div0;
    	let p0;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let div1;
    	let p1;
    	let t3;
    	let br1;
    	let t4;
    	let span;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text("Quelle que soit sa forme, l'expression graphique permet d'affirmer une identité,\n        d'exprimer un positionnement, de porter un discours.");
    			br0 = element("br");
    			t1 = text("C'est une composante essentielle de toute statégie\n        de communication.");
    			t2 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t3 = text("Créé en 1995, Frigo devient en 2006 le bureau de création Bodotika.\n            Basé à Saint-Etienne en région Rhône-Alpes-Auvergne et Avignon en Région Sud,");
    			br1 = element("br");
    			t4 = space();
    			span = element("span");
    			span.textContent = "Bodotika est actif sur tout le territoire métropolitain et les dom/tom.";
    			add_location(br0, file$6, 7, 60, 190);
    			attr_dev(p0, "class", "svelte-1r3iz97");
    			add_location(p0, file$6, 6, 8, 46);
    			attr_dev(div0, "class", "svelte-1r3iz97");
    			add_location(div0, file$6, 5, 4, 32);
    			add_location(br1, file$6, 12, 89, 487);
    			attr_dev(span, "class", "svelte-1r3iz97");
    			add_location(span, file$6, 13, 12, 505);
    			attr_dev(p1, "class", "no-top-margin svelte-1r3iz97");
    			add_location(p1, file$6, 11, 8, 305);
    			attr_dev(div1, "class", "svelte-1r3iz97");
    			add_location(div1, file$6, 10, 4, 291);
    			attr_dev(main, "class", "svelte-1r3iz97");
    			add_location(main, file$6, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(p0, br0);
    			append_dev(p0, t1);
    			append_dev(main, t2);
    			append_dev(main, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t3);
    			append_dev(p1, br1);
    			append_dev(p1, t4);
    			append_dev(p1, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Devise", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Devise> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Devise extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Devise",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Arrow.svelte generated by Svelte v3.38.3 */

    const file$5 = "src/Arrow.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let span;

    	const block = {
    		c: function create() {
    			main = element("main");
    			span = element("span");
    			span.textContent = "→";
    			attr_dev(span, "class", "arrow svelte-g0zm4j");
    			add_location(span, file$5, 4, 4, 31);
    			attr_dev(main, "class", "svelte-g0zm4j");
    			add_location(main, file$5, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Arrow", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Arrow> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Arrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Arrow",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Stats.svelte generated by Svelte v3.38.3 */

    const file$4 = "src/Stats.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let div0;
    	let h20;
    	let t1;
    	let p0;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let t6;
    	let p1;
    	let span2;
    	let t8;
    	let span3;
    	let t10;
    	let t11;
    	let div1;
    	let h21;
    	let t13;
    	let p2;
    	let span4;
    	let br0;
    	let t15;
    	let t16;
    	let p3;
    	let span5;
    	let t18;
    	let span6;
    	let t20;
    	let t21;
    	let div2;
    	let h22;
    	let t23;
    	let p4;
    	let span7;
    	let br1;
    	let t25;
    	let t26;
    	let p5;
    	let span8;
    	let t28;
    	let span9;
    	let t30;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "édition print";
    			t1 = space();
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "60% du C.A. / BtoB 40% :";
    			t3 = text(" animation réseau, presse interne,\n            press spécialisée, édition financière, événementiel ");
    			span1 = element("span");
    			span1.textContent = "/ BtoC 60% :";
    			t5 = text("\n            marketing direct, campagne global, édition commerciale, événementiel.");
    			t6 = space();
    			p1 = element("p");
    			span2 = element("span");
    			span2.textContent = "INTERNALISÉ";
    			t8 = text(" - Suivi de projet - Direction artistique - Graphisme -\n        Illustration - Suivi et conseil en fabrication - Conseil en contenue et en communication /\n        ");
    			span3 = element("span");
    			span3.textContent = "EXTERNALISÉ";
    			t10 = text(" - Rédaction - Prise de vue - Imagerie 3D - Conseil en stratégie\n            opérationnelle - Bureau de style - Achat Media - Pré-test / Post-test");
    			t11 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "packaging";
    			t13 = space();
    			p2 = element("p");
    			span4 = element("span");
    			span4.textContent = "25% du C.A.";
    			br0 = element("br");
    			t15 = text("Identité produit, design porduit, solutions techniques,\n                pré-test, post-test");
    			t16 = space();
    			p3 = element("p");
    			span5 = element("span");
    			span5.textContent = "INTERNALISÉ";
    			t18 = text(" - Suivi de projet - Direction artistique - Graphisme -\n                Illustration - Suivi et conseil en fabrication - Conseil en contenue et en communication /\n                ");
    			span6 = element("span");
    			span6.textContent = "EXTERNALISÉ";
    			t20 = text(" - Rédaction - Prise de vue - Imagerie 3D - Conseil en stratégie\n                opérationnelle - Bureau de style - Achat Media - Pré-test / Post-test");
    			t21 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = "digital design";
    			t23 = space();
    			p4 = element("p");
    			span7 = element("span");
    			span7.textContent = "15% du C.A.";
    			br1 = element("br");
    			t25 = text("Site web, E-commerce, In-store technologies,\n            sound design, motion design, Keynote & PowerPoint");
    			t26 = space();
    			p5 = element("p");
    			span8 = element("span");
    			span8.textContent = "INTERNALISÉ";
    			t28 = text(" - Suivi de projet - Direction artistique - Graphisme -\n                Ergonomie - Motion design /\n                ");
    			span9 = element("span");
    			span9.textContent = "EXTERNALISÉ";
    			t30 = text(" - Integration - Developpement - Rédaction - Prise de vue - Imagerie 3D - Video - Formation -\n            Achat média - Référencement");
    			attr_dev(h20, "class", "svelte-mt30dv");
    			add_location(h20, file$4, 9, 8, 246);
    			attr_dev(span0, "class", "svelte-mt30dv");
    			add_location(span0, file$4, 10, 20, 289);
    			attr_dev(span1, "class", "svelte-mt30dv");
    			add_location(span1, file$4, 11, 64, 425);
    			attr_dev(p0, "class", "svelte-mt30dv");
    			add_location(p0, file$4, 10, 8, 277);
    			attr_dev(span2, "class", "svelte-mt30dv");
    			add_location(span2, file$4, 14, 37, 583);
    			attr_dev(span3, "class", "svelte-mt30dv");
    			add_location(span3, file$4, 16, 8, 770);
    			attr_dev(p1, "class", "thin inlineadjust svelte-mt30dv");
    			add_location(p1, file$4, 14, 8, 554);
    			attr_dev(div0, "class", "col-lg-4 svelte-mt30dv");
    			add_location(div0, file$4, 8, 4, 215);
    			attr_dev(h21, "class", "svelte-mt30dv");
    			add_location(h21, file$4, 21, 12, 996);
    			attr_dev(span4, "class", "svelte-mt30dv");
    			add_location(span4, file$4, 22, 15, 1030);
    			add_location(br0, file$4, 22, 39, 1054);
    			attr_dev(p2, "class", "svelte-mt30dv");
    			add_location(p2, file$4, 22, 12, 1027);
    			attr_dev(span5, "class", "svelte-mt30dv");
    			add_location(span5, file$4, 26, 16, 1226);
    			attr_dev(span6, "class", "svelte-mt30dv");
    			add_location(span6, file$4, 28, 16, 1429);
    			attr_dev(p3, "class", "thin inlineadjust svelte-mt30dv");
    			add_location(p3, file$4, 25, 12, 1180);
    			attr_dev(div1, "class", "col-lg-4 svelte-mt30dv");
    			add_location(div1, file$4, 20, 4, 961);
    			attr_dev(h22, "class", "svelte-mt30dv");
    			add_location(h22, file$4, 34, 12, 1680);
    			attr_dev(span7, "class", "svelte-mt30dv");
    			add_location(span7, file$4, 35, 24, 1728);
    			add_location(br1, file$4, 35, 48, 1752);
    			attr_dev(p4, "class", " svelte-mt30dv");
    			add_location(p4, file$4, 35, 12, 1716);
    			attr_dev(span8, "class", "svelte-mt30dv");
    			add_location(span8, file$4, 37, 28, 1896);
    			attr_dev(span9, "class", "svelte-mt30dv");
    			add_location(span9, file$4, 39, 16, 2036);
    			attr_dev(p5, "class", "thin svelte-mt30dv");
    			add_location(p5, file$4, 37, 12, 1880);
    			attr_dev(div2, "class", "col-lg-4 svelte-mt30dv");
    			add_location(div2, file$4, 33, 8, 1645);
    			attr_dev(main, "class", "d-flex justify-content-between svelte-mt30dv");
    			toggle_class(main, "mobile", /*mobile*/ ctx[0]);
    			add_location(main, file$4, 7, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t3);
    			append_dev(p0, span1);
    			append_dev(p0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, p1);
    			append_dev(p1, span2);
    			append_dev(p1, t8);
    			append_dev(p1, span3);
    			append_dev(p1, t10);
    			append_dev(main, t11);
    			append_dev(main, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t13);
    			append_dev(div1, p2);
    			append_dev(p2, span4);
    			append_dev(p2, br0);
    			append_dev(p2, t15);
    			append_dev(div1, t16);
    			append_dev(div1, p3);
    			append_dev(p3, span5);
    			append_dev(p3, t18);
    			append_dev(p3, span6);
    			append_dev(p3, t20);
    			append_dev(main, t21);
    			append_dev(main, div2);
    			append_dev(div2, h22);
    			append_dev(div2, t23);
    			append_dev(div2, p4);
    			append_dev(p4, span7);
    			append_dev(p4, br1);
    			append_dev(p4, t25);
    			append_dev(div2, t26);
    			append_dev(div2, p5);
    			append_dev(p5, span8);
    			append_dev(p5, t28);
    			append_dev(p5, span9);
    			append_dev(p5, t30);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Stats", slots, []);
    	const screen_width = window.innerWidth > 0 ? window.innerWidth : screen.width;
    	let mobile = screen_width > 575 ? 0 : 1;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stats> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ screen_width, mobile });

    	$$self.$inject_state = $$props => {
    		if ("mobile" in $$props) $$invalidate(0, mobile = $$props.mobile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mobile];
    }

    class Stats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stats",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* instafeed.js | v2.0.0 | https://github.com/stevenschobert/instafeed.js | License: MIT */
    function assert(val, msg) {
      if (!val) {
        throw new Error(msg);
      }
    }

    function Instafeed(options) {
      assert(!options || typeof options === "object", "options must be an object, got " + options + " (" + typeof options + ")");
      var opts = {
        accessToken: null,
        accessTokenTimeout: 1e4,
        after: null,
        apiTimeout: 1e4,
        apiLimit: null,
        before: null,
        debug: false,
        error: null,
        filter: null,
        limit: null,
        mock: false,
        render: null,
        sort: null,
        success: null,
        target: "instafeed",
        template: '<a href="{{link}}"><img title="{{caption}}" src="{{image}}" /></a>',
        templateBoundaries: [ "{{", "}}" ],
        transform: null
      };
      var state = {
        running: false,
        node: null,
        token: null,
        paging: null,
        pool: []
      };
      if (options) {
        for (var optKey in opts) {
          if (typeof options[optKey] !== "undefined") {
            opts[optKey] = options[optKey];
          }
        }
      }
      assert(typeof opts.target === "string" || typeof opts.target === "object", "target must be a string or DOM node, got " + opts.target + " (" + typeof opts.target + ")");
      assert(typeof opts.accessToken === "string" || typeof opts.accessToken === "function", "accessToken must be a string or function, got " + opts.accessToken + " (" + typeof opts.accessToken + ")");
      assert(typeof opts.accessTokenTimeout === "number", "accessTokenTimeout must be a number, got " + opts.accessTokenTimeout + " (" + typeof opts.accessTokenTimeout + ")");
      assert(typeof opts.apiTimeout === "number", "apiTimeout must be a number, got " + opts.apiTimeout + " (" + typeof opts.apiTimeout + ")");
      assert(typeof opts.debug === "boolean", "debug must be true or false, got " + opts.debug + " (" + typeof opts.debug + ")");
      assert(typeof opts.mock === "boolean", "mock must be true or false, got " + opts.mock + " (" + typeof opts.mock + ")");
      assert(typeof opts.templateBoundaries === "object" && opts.templateBoundaries.length === 2 && typeof opts.templateBoundaries[0] === "string" && typeof opts.templateBoundaries[1] === "string", "templateBoundaries must be an array of 2 strings, got " + opts.templateBoundaries + " (" + typeof opts.templateBoundaries + ")");
      assert(!opts.template || typeof opts.template === "string", "template must null or string, got " + opts.template + " (" + typeof opts.template + ")");
      assert(!opts.error || typeof opts.error === "function", "error must be null or function, got " + opts.error + " (" + typeof opts.error + ")");
      assert(!opts.before || typeof opts.before === "function", "before must be null or function, got " + opts.before + " (" + typeof opts.before + ")");
      assert(!opts.after || typeof opts.after === "function", "after must be null or function, got " + opts.after + " (" + typeof opts.after + ")");
      assert(!opts.success || typeof opts.success === "function", "success must be null or function, got " + opts.success + " (" + typeof opts.success + ")");
      assert(!opts.filter || typeof opts.filter === "function", "filter must be null or function, got " + opts.filter + " (" + typeof opts.filter + ")");
      assert(!opts.transform || typeof opts.transform === "function", "transform must be null or function, got " + opts.transform + " (" + typeof opts.transform + ")");
      assert(!opts.sort || typeof opts.sort === "function", "sort must be null or function, got " + opts.sort + " (" + typeof opts.sort + ")");
      assert(!opts.render || typeof opts.render === "function", "render must be null or function, got " + opts.render + " (" + typeof opts.render + ")");
      assert(!opts.limit || typeof opts.limit === "number", "limit must be null or number, got " + opts.limit + " (" + typeof opts.limit + ")");
      assert(!opts.apiLimit || typeof opts.apiLimit === "number", "apiLimit must null or number, got " + opts.apiLimit + " (" + typeof opts.apiLimit + ")");
      this._state = state;
      this._options = opts;
    }

    Instafeed.prototype.run = function run() {
      var scope = this;
      this._debug("run", "options", this._options);
      this._debug("run", "state", this._state);
      if (this._state.running) {
        this._debug("run", "already running, skipping");
        return false;
      }
      this._start();
      this._debug("run", "getting dom node");
      if (typeof this._options.target === "string") {
        this._state.node = document.getElementById(this._options.target);
      } else {
        this._state.node = this._options.target;
      }
      if (!this._state.node) {
        this._fail(new Error("no element found with ID " + this._options.target));
        return false;
      }
      this._debug("run", "got dom node", this._state.node);
      this._debug("run", "getting access token");
      this._getAccessToken(function onTokenReceived(err, token) {
        if (err) {
          scope._debug("onTokenReceived", "error", err);
          scope._fail(new Error("error getting access token: " + err.message));
          return;
        }
        scope._debug("onTokenReceived", "got token", token);
        scope._state.token = token;
        scope._showNext(function onNextShown(err) {
          if (err) {
            scope._debug("onNextShown", "error", err);
            scope._fail(err);
            return;
          }
          scope._finish();
        });
      });
      return true;
    };

    Instafeed.prototype.hasNext = function hasNext() {
      var paging = this._state.paging;
      var pool = this._state.pool;
      this._debug("hasNext", "paging", paging);
      this._debug("hasNext", "pool", pool.length, pool);
      return pool.length > 0 || paging && typeof paging.next === "string";
    };

    Instafeed.prototype.next = function next() {
      var scope = this;
      if (!scope.hasNext()) {
        scope._debug("next", "hasNext is false, skipping");
        return false;
      }
      if (scope._state.running) {
        scope._debug("next", "already running, skipping");
        return false;
      }
      scope._start();
      scope._showNext(function onNextShown(err) {
        if (err) {
          scope._debug("onNextShown", "error", err);
          scope._fail(err);
          return;
        }
        scope._finish();
      });
    };

    Instafeed.prototype._showNext = function showNext(callback) {
      var scope = this;
      var url = null;
      var poolItems = null;
      var hasLimit = typeof this._options.limit === "number";
      scope._debug("showNext", "pool", scope._state.pool.length, scope._state.pool);
      if (scope._state.pool.length > 0) {
        if (hasLimit) {
          poolItems = scope._state.pool.splice(0, scope._options.limit);
        } else {
          poolItems = scope._state.pool.splice(0);
        }
        scope._debug("showNext", "items from pool", poolItems.length, poolItems);
        scope._debug("showNext", "updated pool", scope._state.pool.length, scope._state.pool);
        if (scope._options.mock) {
          scope._debug("showNext", "mock enabled, skipping render");
        } else {
          try {
            scope._renderData(poolItems);
          } catch (renderErr) {
            callback(renderErr);
            return;
          }
        }
        callback(null);
      } else {
        if (scope._state.paging && typeof scope._state.paging.next === "string") {
          url = scope._state.paging.next;
        } else {
          url = "https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=" + scope._state.token;
          if (!scope._options.apiLimit && typeof scope._options.limit === "number") {
            scope._debug("showNext", "no apiLimit set, falling back to limit", scope._options.apiLimit, scope._options.limit);
            url = url + "&limit=" + scope._options.limit;
          } else if (typeof scope._options.apiLimit === "number") {
            scope._debug("showNext", "apiLimit set, overriding limit", scope._options.apiLimit, scope._options.limit);
            url = url + "&limit=" + scope._options.apiLimit;
          }
        }
        scope._debug("showNext", "making request", url);
        scope._makeApiRequest(url, function onResponseReceived(err, data) {
          var processed = null;
          if (err) {
            scope._debug("onResponseReceived", "error", err);
            callback(new Error("api request error: " + err.message));
            return;
          }
          scope._debug("onResponseReceived", "data", data);
          scope._success(data);
          scope._debug("onResponseReceived", "setting paging", data.paging);
          scope._state.paging = data.paging;
          try {
            processed = scope._processData(data);
            scope._debug("onResponseReceived", "processed data", processed);
            if (processed.unused && processed.unused.length > 0) {
              scope._debug("onResponseReceived", "saving unused to pool", processed.unused.length, processed.unused);
              for (var i = 0; i < processed.unused.length; i++) {
                scope._state.pool.push(processed.unused[i]);
              }
            }
          } catch (processErr) {
            callback(processErr);
            return;
          }
          if (scope._options.mock) {
            scope._debug("onResponseReceived", "mock enabled, skipping append");
          } else {
            try {
              scope._renderData(processed.items);
            } catch (renderErr) {
              callback(renderErr);
              return;
            }
          }
          callback(null);
        });
      }
    };

    Instafeed.prototype._processData = function processData(data) {
      var hasTransform = typeof this._options.transform === "function";
      var hasFilter = typeof this._options.filter === "function";
      var hasSort = typeof this._options.sort === "function";
      var hasLimit = typeof this._options.limit === "number";
      var transformedFiltered = [];
      var limitDelta = null;
      var dataItem = null;
      var transformedItem = null;
      var filterResult = null;
      var unusedItems = null;
      this._debug("processData", "hasFilter", hasFilter, "hasTransform", hasTransform, "hasSort", hasSort, "hasLimit", hasLimit);
      if (typeof data !== "object" || typeof data.data !== "object" || data.data.length <= 0) {
        return null;
      }
      for (var i = 0; i < data.data.length; i++) {
        dataItem = this._getItemData(data.data[i]);
        if (hasTransform) {
          try {
            transformedItem = this._options.transform(dataItem);
            this._debug("processData", "transformed item", dataItem, transformedItem);
          } catch (err) {
            this._debug("processData", "error calling transform", err);
            throw new Error("error in transform: " + err.message);
          }
        } else {
          transformedItem = dataItem;
        }
        if (hasFilter) {
          try {
            filterResult = this._options.filter(transformedItem);
            this._debug("processData", "filter item result", transformedItem, filterResult);
          } catch (err) {
            this._debug("processData", "error calling filter", err);
            throw new Error("error in filter: " + err.message);
          }
          if (filterResult) {
            transformedFiltered.push(transformedItem);
          }
        } else {
          transformedFiltered.push(transformedItem);
        }
      }
      if (hasSort) {
        try {
          transformedFiltered.sort(this._options.sort);
        } catch (err) {
          this._debug("processData", "error calling sort", err);
          throw new Error("error in sort: " + err.message);
        }
      }
      if (hasLimit) {
        limitDelta = transformedFiltered.length - this._options.limit;
        this._debug("processData", "checking limit", transformedFiltered.length, this._options.limit, limitDelta);
        if (limitDelta > 0) {
          unusedItems = transformedFiltered.slice(transformedFiltered.length - limitDelta);
          this._debug("processData", "unusedItems", unusedItems.length, unusedItems);
          transformedFiltered.splice(transformedFiltered.length - limitDelta, limitDelta);
        }
      }
      return {
        items: transformedFiltered,
        unused: unusedItems
      };
    };

    Instafeed.prototype._extractTags = function extractTags(str) {
      var exp = /#([^\s]+)/gi;
      var badChars = /[~`!@#$%^&*\(\)\-\+={}\[\]:;"'<>\?,\./|\\\s]+/i;
      var tags = [];
      var match = null;
      if (typeof str === "string") {
        while ((match = exp.exec(str)) !== null) {
          if (badChars.test(match[1]) === false) {
            tags.push(match[1]);
          }
        }
      }
      return tags;
    };

    Instafeed.prototype._getItemData = function getItemData(data) {
      var type = null;
      var image = null;
      switch (data.media_type) {
       case "IMAGE":
        type = "image";
        image = data.media_url;
        break;

       case "VIDEO":
        type = "video";
        image = data.thumbnail_url;
        break;

       case "CAROUSEL_ALBUM":
        type = "album";
        image = data.media_url;
        break;
      }
      return {
        caption: data.caption,
        tags: this._extractTags(data.caption),
        id: data.id,
        image: image,
        link: data.permalink,
        model: data,
        timestamp: data.timestamp,
        type: type,
        username: data.username
      };
    };

    Instafeed.prototype._renderData = function renderData(items) {
      var hasTemplate = typeof this._options.template === "string";
      var hasRender = typeof this._options.render === "function";
      var item = null;
      var itemHtml = null;
      var container = null;
      var html = "";
      this._debug("renderData", "hasTemplate", hasTemplate, "hasRender", hasRender);
      if (typeof items !== "object" || items.length <= 0) {
        return;
      }
      for (var i = 0; i < items.length; i++) {
        item = items[i];
        if (hasRender) {
          try {
            itemHtml = this._options.render(item, this._options);
            this._debug("renderData", "custom render result", item, itemHtml);
          } catch (err) {
            this._debug("renderData", "error calling render", err);
            throw new Error("error in render: " + err.message);
          }
        } else if (hasTemplate) {
          itemHtml = this._basicRender(item);
        }
        if (itemHtml) {
          html = html + itemHtml;
        } else {
          this._debug("renderData", "render item did not return any content", item);
        }
      }
      this._debug("renderData", "html content", html);
      container = document.createElement("div");
      container.innerHTML = html;
      this._debug("renderData", "container", container, container.childNodes.length, container.childNodes);
      while (container.childNodes.length > 0) {
        this._debug("renderData", "appending child", container.childNodes[0]);
        this._state.node.appendChild(container.childNodes[0]);
      }
    };

    Instafeed.prototype._basicRender = function basicRender(data) {
      var exp = new RegExp(this._options.templateBoundaries[0] + "([\\s\\w.]+)" + this._options.templateBoundaries[1], "gm");
      var template = this._options.template;
      var match = null;
      var output = "";
      var substr = null;
      var lastIndex = 0;
      var keyPath = null;
      var keyPathValue = null;
      while ((match = exp.exec(template)) !== null) {
        keyPath = match[1];
        substr = template.slice(lastIndex, match.index);
        output = output + substr;
        keyPathValue = this._valueForKeyPath(keyPath, data);
        if (keyPathValue) {
          output = output + keyPathValue.toString();
        }
        lastIndex = exp.lastIndex;
      }
      if (lastIndex < template.length) {
        substr = template.slice(lastIndex, template.length);
        output = output + substr;
      }
      return output;
    };

    Instafeed.prototype._valueForKeyPath = function valueForKeyPath(keyPath, data) {
      var exp = /([\w]+)/gm;
      var match = null;
      var key = null;
      var lastValue = data;
      while ((match = exp.exec(keyPath)) !== null) {
        if (typeof lastValue !== "object") {
          return null;
        }
        key = match[1];
        lastValue = lastValue[key];
      }
      return lastValue;
    };

    Instafeed.prototype._fail = function fail(err) {
      var didHook = this._runHook("error", err);
      if (!didHook && console && typeof console.error === "function") {
        console.error(err);
      }
      this._state.running = false;
    };

    Instafeed.prototype._start = function start() {
      this._state.running = true;
      this._runHook("before");
    };

    Instafeed.prototype._finish = function finish() {
      this._runHook("after");
      this._state.running = false;
    };

    Instafeed.prototype._success = function success(data) {
      this._runHook("success", data);
      this._state.running = false;
    };

    Instafeed.prototype._makeApiRequest = function makeApiRequest(url, callback) {
      var called = false;
      var scope = this;
      var apiRequest = null;
      var callbackOnce = function callbackOnce(err, value) {
        if (!called) {
          called = true;
          callback(err, value);
        }
      };
      apiRequest = new XMLHttpRequest();
      apiRequest.ontimeout = function apiRequestTimedOut() {
        callbackOnce(new Error("api request timed out"));
      };
      apiRequest.onerror = function apiRequestOnError() {
        callbackOnce(new Error("api connection error"));
      };
      apiRequest.onload = function apiRequestOnLoad(event) {
        var contentType = apiRequest.getResponseHeader("Content-Type");
        var responseJson = null;
        scope._debug("apiRequestOnLoad", "loaded", event);
        scope._debug("apiRequestOnLoad", "response status", apiRequest.status);
        scope._debug("apiRequestOnLoad", "response content type", contentType);
        if (contentType.indexOf("application/json") >= 0) {
          try {
            responseJson = JSON.parse(apiRequest.responseText);
          } catch (err) {
            scope._debug("apiRequestOnLoad", "json parsing error", err, apiRequest.responseText);
            callbackOnce(new Error("error parsing response json"));
            return;
          }
        }
        if (apiRequest.status !== 200) {
          if (responseJson && responseJson.error) {
            callbackOnce(new Error(responseJson.error.code + " " + responseJson.error.message));
          } else {
            callbackOnce(new Error("status code " + apiRequest.status));
          }
          return;
        }
        callbackOnce(null, responseJson);
      };
      apiRequest.open("GET", url, true);
      apiRequest.timeout = this._options.apiTimeout;
      apiRequest.send();
    };

    Instafeed.prototype._getAccessToken = function getAccessToken(callback) {
      var called = false;
      var scope = this;
      var timeoutCheck = null;
      var callbackOnce = function callbackOnce(err, value) {
        if (!called) {
          called = true;
          clearTimeout(timeoutCheck);
          callback(err, value);
        }
      };
      if (typeof this._options.accessToken === "function") {
        this._debug("getAccessToken", "calling accessToken as function");
        timeoutCheck = setTimeout(function accessTokenTimeoutCheck() {
          scope._debug("getAccessToken", "timeout check", called);
          callbackOnce(new Error("accessToken timed out"), null);
        }, this._options.accessTokenTimeout);
        try {
          this._options.accessToken(function accessTokenReceiver(err, value) {
            scope._debug("getAccessToken", "received accessToken callback", called, err, value);
            callbackOnce(err, value);
          });
        } catch (err) {
          this._debug("getAccessToken", "error invoking the accessToken as function", err);
          callbackOnce(err, null);
        }
      } else {
        this._debug("getAccessToken", "treating accessToken as static", typeof this._options.accessToken);
        callbackOnce(null, this._options.accessToken);
      }
    };

    Instafeed.prototype._debug = function debug() {
      var args = null;
      if (this._options.debug && console && typeof console.log === "function") {
        args = [].slice.call(arguments);
        args[0] = "[Instafeed] [" + args[0] + "]";
        console.log.apply(null, args);
      }
    };

    Instafeed.prototype._runHook = function runHook(hookName, data) {
      var success = false;
      if (typeof this._options[hookName] === "function") {
        try {
          this._options[hookName](data);
          success = true;
        } catch (err) {
          this._debug("runHook", "error calling hook", hookName, err);
        }
      }
      return success;
    };

    /* src/Insta.svelte generated by Svelte v3.38.3 */
    const file$3 = "src/Insta.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "instafeed");
    			attr_dev(div0, "class", "row svelte-1u45xfi");
    			add_location(div0, file$3, 41, 8, 1520);
    			attr_dev(div1, "class", "contain svelte-1u45xfi");
    			add_location(div1, file$3, 40, 4, 1490);
    			attr_dev(main, "class", "svelte-1u45xfi");
    			add_location(main, file$3, 39, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Insta", slots, []);
    	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    	const obs_padding = new MutationObserver(function () {
    			const imgs_id = document.querySelectorAll("#img");

    			for (let i = 0; i < imgs_id.length; i++) {
    				if (i % 3 === 1) {
    					imgs_id.item(i).classList.add("middle_img");
    				} else if (i % 3 === 0) {
    					imgs_id.item(i).classList.add("left_img");
    				} else {
    					imgs_id.item(i).classList.add("right_img");
    				}
    			}
    		});

    	document.addEventListener("DOMContentLoaded", () => {
    		const feed = new Instafeed({
    				accessToken: "IGQVJWOGdHMThGWkN3bkdDblpGODBSMG9PUjVnNkhELVJtazBOTUVQeGozbGJ3TU5mUTNsZAlJtMWxoNjFqaFE3Mmp2cW9hVHNoaklJd1ZARYlhaWUF0eXlNbFFpMEhKYXlZAZAUYybmpBTnM3X2ROMTJHeQZDZD",
    				template: "<div id=\"col\" class=\"list-item py-4 col-sm-4 d-flex flex-wrap justify-content-sm-between\"><a href=\"{{link}}\" target=\"_blank\"><img id=\"img\" alt=\"{{caption}}\" title=\"{{caption}}\" src=\"{{image}}\" class=\"img-fluid img\"/></a></div>",
    				resolution: "standard_resolution",
    				sortBy: "most-recent",
    				limit: 9
    			});

    		feed.run();
    		const row = document.querySelector(".row");
    		obs_padding.observe(row, { childList: true, subtree: true });
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Insta> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Instafeed, obs_padding });
    	return [];
    }

    class Insta extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Insta",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Clients.svelte generated by Svelte v3.38.3 */

    const file$2 = "src/Clients.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let span2;
    	let t6;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text("Alex Bruden, ASSE ");
    			span0 = element("span");
    			span0.textContent = "/";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Nous les avons accompagnés";
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "/";
    			t6 = text(" Bouygues Immobilier, Boissy,\n        Carigel, Chapuis Armes, Courbon SA, communauté de communes de Saint-Etienne,\n        Crédit agricole Corporate and Investment Bank, département du Rhône,\n        département de la Loire, Diamant Distribution, Elf, Eurovia, Godonnier,\n        Lavazza France, Laurent SA, La Niçoise, Laboratoire Aventis Pasteur,\n        Laboratoire UCB, Mijno SA, musée d'Art Moderne de Saint-Etienne, Olivo,\n        Outillage de Saint-Etienne, Provence Tradition, Renault Merchandising,\n        Renault Sport, Saint-Gobain Conditionnement, Seram SA, Shopix Groupe,\n        Souchon d'Auvergne Savencia, Source Parot, Stores Matest, ville de Lyon,\n        ville de Saint-Etienne, Vinci, Vinci Energies, Volvo Trucks, Vivendi, WBH Agency.");
    			attr_dev(span0, "class", "svelte-59app5");
    			add_location(span0, file$2, 6, 26, 63);
    			attr_dev(span1, "class", "svelte-59app5");
    			add_location(span1, file$2, 6, 41, 78);
    			attr_dev(span2, "class", "svelte-59app5");
    			add_location(span2, file$2, 6, 82, 119);
    			attr_dev(h2, "class", "svelte-59app5");
    			add_location(h2, file$2, 5, 4, 32);
    			attr_dev(main, "class", "svelte-59app5");
    			add_location(main, file$2, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(h2, span0);
    			append_dev(h2, t2);
    			append_dev(h2, span1);
    			append_dev(h2, t4);
    			append_dev(h2, span2);
    			append_dev(h2, t6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clients", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clients> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Clients extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clients",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/MentionLegales.svelte generated by Svelte v3.38.3 */
    const file$1 = "src/MentionLegales.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let h10;
    	let span0;
    	let span1;
    	let span2;
    	let t2;
    	let b;
    	let t4;
    	let t5;
    	let div1;
    	let i;
    	let t6;
    	let div3;
    	let h11;
    	let t8;
    	let p0;
    	let strong0;
    	let br0;
    	let t10;
    	let a0;
    	let t12;
    	let t13;
    	let p1;
    	let strong1;
    	let t15;
    	let p2;
    	let t16;
    	let a1;
    	let t18;
    	let strong2;
    	let strong3;
    	let t21;
    	let t22;
    	let p3;
    	let strong4;
    	let strong5;
    	let br1;
    	let t25;
    	let strong6;
    	let t27;
    	let strong7;
    	let strong8;
    	let t30;
    	let strong9;
    	let t32;
    	let p4;
    	let strong10;
    	let strong11;
    	let br2;
    	let t35;
    	let strong12;
    	let t37;
    	let strong13;
    	let strong14;
    	let strong15;
    	let t41;
    	let p5;
    	let t42;
    	let strong16;
    	let br3;
    	let t44;
    	let strong17;
    	let t46;
    	let br4;
    	let t47;
    	let br5;
    	let t48;
    	let strong18;
    	let br6;
    	let t50;
    	let strong19;
    	let t52;
    	let p6;
    	let t54;
    	let p7;
    	let strong20;
    	let t56;
    	let p8;
    	let t57;
    	let strong21;
    	let br7;
    	let t59;
    	let u;
    	let strong22;
    	let t61;
    	let strong23;
    	let a2;
    	let br8;
    	let t63;
    	let strong24;
    	let a3;
    	let t65;
    	let p9;
    	let t67;
    	let p10;
    	let strong25;
    	let t69;
    	let p11;
    	let t70;
    	let a4;
    	let t72;
    	let a5;
    	let t74;
    	let a6;
    	let t76;
    	let t77;
    	let p12;
    	let strong26;
    	let t79;
    	let p13;
    	let t81;
    	let p14;
    	let strong27;
    	let t83;
    	let p15;
    	let t84;
    	let a7;
    	let t86;
    	let a8;
    	let t88;
    	let t89;
    	let p16;
    	let strong28;
    	let t91;
    	let p17;
    	let t92;
    	let a9;
    	let t94;
    	let t95;
    	let p18;
    	let t96;
    	let a10;
    	let t98;
    	let a11;
    	let t100;
    	let a12;
    	let t102;
    	let a13;
    	let t104;
    	let t105;
    	let p19;
    	let t106;
    	let a14;
    	let t108;
    	let a15;
    	let t110;
    	let a16;
    	let t112;
    	let t113;
    	let p20;
    	let t114;
    	let a17;
    	let t116;
    	let t117;
    	let p21;
    	let main_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Bodotika";
    			span1 = element("span");
    			span1.textContent = "Bureau de création et d'édition _\n                ";
    			span2 = element("span");
    			t2 = text("Avignon ");
    			b = element("b");
    			b.textContent = "/";
    			t4 = text(" Saint-Etienne");
    			t5 = space();
    			div1 = element("div");
    			i = element("i");
    			t6 = space();
    			div3 = element("div");
    			h11 = element("h1");
    			h11.textContent = "MENTIONS LEGALES :";
    			t8 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = " ";
    			br0 = element("br");
    			t10 = text("\n            Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique, dite L.C.E.N., nous portons à la connaissance des utilisateurs et visiteurs du site : ");
    			a0 = element("a");
    			a0.textContent = "www.bodotika.fr";
    			t12 = text(" les informations suivantes :");
    			t13 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "ÉDITEUR";
    			t15 = space();
    			p2 = element("p");
    			t16 = text("Le site ");
    			a1 = element("a");
    			a1.textContent = "www.bodotika.fr";
    			t18 = text(" est la propriété exclusive de ");
    			strong2 = element("strong");
    			strong2.textContent = "SAS ";
    			strong3 = element("strong");
    			strong3.textContent = "Bodotika";
    			t21 = text(", qui l'édite.");
    			t22 = space();
    			p3 = element("p");
    			strong4 = element("strong");
    			strong4.textContent = "Bodotika";
    			strong5 = element("strong");
    			strong5.textContent = " ";
    			br1 = element("br");
    			t25 = space();
    			strong6 = element("strong");
    			strong6.textContent = "SAS ";
    			t27 = text("au capital de");
    			strong7 = element("strong");
    			strong7.textContent = " ";
    			strong8 = element("strong");
    			strong8.textContent = "1000 ";
    			t30 = text("€ Tél  : ");
    			strong9 = element("strong");
    			strong9.textContent = "0677413261";
    			t32 = space();
    			p4 = element("p");
    			strong10 = element("strong");
    			strong10.textContent = "ALLEZ LES NOUILLES, 3 RUE JACQUES CONSTANT MILLERET 42000 SAINT-ETIENNE ";
    			strong11 = element("strong");
    			strong11.textContent = "42000 Saint-Étienne";
    			br2 = element("br");
    			t35 = text("\n            Immatriculée au Registre du Commerce et des Sociétés de  ");
    			strong12 = element("strong");
    			strong12.textContent = "Saint-Etienne B 492 193 586 ";
    			t37 = text("sous le numéro");
    			strong13 = element("strong");
    			strong13.textContent = " ";
    			strong14 = element("strong");
    			strong14.textContent = "49219358600038";
    			strong15 = element("strong");
    			strong15.textContent = " ";
    			t41 = space();
    			p5 = element("p");
    			t42 = text("Numéro TVA intracommunautaire : ");
    			strong16 = element("strong");
    			strong16.textContent = "FR16492193586";
    			br3 = element("br");
    			t44 = text("\n            Adresse de courrier électronique : ");
    			strong17 = element("strong");
    			strong17.textContent = "bonjour@bodotika.fr";
    			t46 = text(" ");
    			br4 = element("br");
    			t47 = text("\n             ");
    			br5 = element("br");
    			t48 = text("\n            Directeur de la  publication : ");
    			strong18 = element("strong");
    			strong18.textContent = "Thomas Lajournade";
    			br6 = element("br");
    			t50 = text("\n            Contactez le responsable de la publication : ");
    			strong19 = element("strong");
    			strong19.textContent = "bonjour@bodotika.fr";
    			t52 = space();
    			p6 = element("p");
    			p6.textContent = " ";
    			t54 = space();
    			p7 = element("p");
    			strong20 = element("strong");
    			strong20.textContent = "HÉBERGEMENT";
    			t56 = space();
    			p8 = element("p");
    			t57 = text("Le site est hébergé par ");
    			strong21 = element("strong");
    			strong21.textContent = "1&1 IONOS SE Ernst-Frey Strasse 9 76135 KARLSRUHE";
    			br7 = element("br");
    			t59 = space();
    			u = element("u");
    			strong22 = element("strong");
    			strong22.textContent = "CREDITS :";
    			t61 = text(" les mentions légales ont étés générées par ");
    			strong23 = element("strong");
    			a2 = element("a");
    			a2.textContent = "mentions légales";
    			br8 = element("br");
    			t63 = text("\n            Horaires de la ");
    			strong24 = element("strong");
    			a3 = element("a");
    			a3.textContent = "Patinoire Lyon";
    			t65 = space();
    			p9 = element("p");
    			p9.textContent = " ";
    			t67 = space();
    			p10 = element("p");
    			strong25 = element("strong");
    			strong25.textContent = "DESCRIPTION DES SERVICES FOURNIS";
    			t69 = space();
    			p11 = element("p");
    			t70 = text("Le site ");
    			a4 = element("a");
    			a4.textContent = "www.bodotika.fr";
    			t72 = text(" a pour objet de fournir une information concernant l’ensemble des activités de la société. Le proprietaire du site s’efforce de fournir sur le site ");
    			a5 = element("a");
    			a5.textContent = "www.bodotika.fr";
    			t74 = text(" des informations aussi précises que possible. Toutefois, il ne pourra être tenue responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu’elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations. Tous les informations proposées sur le site ");
    			a6 = element("a");
    			a6.textContent = "www.bodotika.fr";
    			t76 = text(" sont données à titre indicatif, sont non exhaustives, et sont susceptibles d’évoluer. Elles sont données sous réserve de modifications ayant été apportées depuis leur mise en ligne.  ");
    			t77 = space();
    			p12 = element("p");
    			strong26 = element("strong");
    			strong26.textContent = "PROPRIÉTÉ INTELLECTUELLE ET CONTREFAÇONS";
    			t79 = space();
    			p13 = element("p");
    			p13.textContent = "Le proprietaire du site est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels… Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable à l'email : bonjour@bodotika.fr  . Toute exploitation non autorisée du site ou de l’un quelconque de ces éléments qu’il contient sera considérée comme constitutive d’une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.  ";
    			t81 = space();
    			p14 = element("p");
    			strong27 = element("strong");
    			strong27.textContent = "LIENS HYPERTEXTES ET COOKIES";
    			t83 = space();
    			p15 = element("p");
    			t84 = text("Le site ");
    			a7 = element("a");
    			a7.textContent = "www.bodotika.fr";
    			t86 = text(" contient un certain nombre de liens hypertextes vers d’autres sites (partenaires, informations …) mis en place avec l’autorisation de le proprietaire du site . Cependant, le proprietaire du site n’a pas la possibilité de vérifier le contenu des sites ainsi visités  et décline donc toute responsabilité de ce fait quand aux risques éventuels de contenus illicites. L’utilisateur est informé que lors de ses visites sur le site ");
    			a8 = element("a");
    			a8.textContent = "www.bodotika.fr";
    			t88 = text(", un ou des cookies sont susceptible de s’installer automatiquement sur son ordinateur. Un cookie est un fichier de petite taille, qui ne permet pas l’identification de l’utilisateur, mais qui enregistre des informations relatives à la navigation d’un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation. Le paramétrage du logiciel de navigation permet d’informer de la présence de cookie et éventuellement, de refuser de la manière décrite à l’adresse suivante : www.cnil.fr Le refus d’installation d’un cookie peut entraîner l’impossibilité d’accéder à certains services. L’utilisateur peut toutefois configurer son ordinateur de la manière suivante, pour refuser l’installation des cookies : Sous Internet Explorer : onglet outil / options internet. Cliquez sur Confidentialité et choisissez Bloquer tous les cookies. Validez sur Ok. Sous Netscape : onglet édition / préférences. Cliquez sur Avancées et choisissez Désactiver les cookies. Validez sur Ok.  ");
    			t89 = space();
    			p16 = element("p");
    			strong28 = element("strong");
    			strong28.textContent = "PROTECTION DES BIENS ET DES PERSONNES - GESTION DES DONNÉES PERSONNELLES";
    			t91 = space();
    			p17 = element("p");
    			t92 = text("Utilisateur : Internaute se connectant, utilisant le site susnommé : ");
    			a9 = element("a");
    			a9.textContent = "www.bodotika.fr";
    			t94 = text(" En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995.");
    			t95 = space();
    			p18 = element("p");
    			t96 = text("Sur le site ");
    			a10 = element("a");
    			a10.textContent = "www.bodotika.fr";
    			t98 = text(", le proprietaire du site ne collecte des informations personnelles relatives à l'utilisateur que pour le besoin de certains services proposés par le site ");
    			a11 = element("a");
    			a11.textContent = "www.bodotika.fr";
    			t100 = text(". L'utilisateur fournit ces informations en toute connaissance de cause, notamment lorsqu'il procède par lui-même à leur saisie. Il est alors précisé à l'utilisateur du site ");
    			a12 = element("a");
    			a12.textContent = "www.bodotika.fr";
    			t102 = text(" l’obligation ou non de fournir ces informations. Conformément aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés, tout utilisateur dispose d’un droit d’accès, de rectification, de suppression et d’opposition aux données personnelles le concernant. Pour l’exercer, adressez votre demande à ");
    			a13 = element("a");
    			a13.textContent = "www.bodotika.fr";
    			t104 = text(" par email : email du webmaster ou  en effectuant sa demande écrite et signée, accompagnée d’une copie du titre d’identité avec signature du titulaire de la pièce, en précisant l’adresse à laquelle la réponse doit être envoyée.");
    			t105 = space();
    			p19 = element("p");
    			t106 = text("Aucune information personnelle de l'utilisateur du site ");
    			a14 = element("a");
    			a14.textContent = "www.bodotika.fr";
    			t108 = text(" n'est publiée à l'insu de l'utilisateur, échangée, transférée, cédée ou vendue sur un support quelconque à des tiers. Seule l'hypothèse du rachat du site ");
    			a15 = element("a");
    			a15.textContent = "www.bodotika.fr";
    			t110 = text(" à le proprietaire du site et de ses droits permettrait la transmission des dites informations à l'éventuel acquéreur qui serait à son tour tenu de la même obligation de conservation et de modification des données vis à vis de l'utilisateur du site ");
    			a16 = element("a");
    			a16.textContent = "www.bodotika.fr";
    			t112 = text(".");
    			t113 = space();
    			p20 = element("p");
    			t114 = text("Le site ");
    			a17 = element("a");
    			a17.textContent = "www.bodotika.fr";
    			t116 = text(" est en conformité avec le RGPD voir notre politique RGPD  www.no-cookies.thx.");
    			t117 = space();
    			p21 = element("p");
    			p21.textContent = "Les bases de données sont protégées par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative à la protection juridique des bases de données.";
    			attr_dev(span0, "class", "svelte-1asvw9u");
    			add_location(span0, file$1, 11, 25, 330);
    			attr_dev(span1, "class", "svelte-1asvw9u");
    			add_location(span1, file$1, 11, 46, 351);
    			set_style(b, "font-weight", "500");
    			set_style(b, "color", "rgba(0, 0, 0, 0.78)");
    			set_style(b, "font-size", "11px");
    			add_location(b, file$1, 12, 37, 428);
    			attr_dev(span2, "class", "svelte-1asvw9u");
    			add_location(span2, file$1, 12, 23, 414);
    			attr_dev(h10, "class", " svelte-1asvw9u");
    			add_location(h10, file$1, 11, 12, 317);
    			attr_dev(div0, "class", "titleml col-auto mr-auto svelte-1asvw9u");
    			add_location(div0, file$1, 10, 8, 266);
    			attr_dev(i, "class", "fa fa-times svelte-1asvw9u");
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file$1, 15, 12, 628);
    			attr_dev(div1, "class", "titlelink col-auto d-flex align-items-center");
    			add_location(div1, file$1, 14, 8, 557);
    			attr_dev(div2, "class", "align-items-center cont svelte-1asvw9u");
    			add_location(div2, file$1, 9, 4, 220);
    			add_location(h11, file$1, 19, 8, 802);
    			add_location(strong0, file$1, 21, 38, 869);
    			add_location(br0, file$1, 21, 56, 887);
    			attr_dev(a0, "href", "http://www.bodotika.fr");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$1, 22, 236, 1130);
    			set_style(p0, "text-align", "justify");
    			add_location(p0, file$1, 21, 8, 839);
    			add_location(strong1, file$1, 24, 38, 1271);
    			set_style(p1, "text-align", "justify");
    			add_location(p1, file$1, 24, 8, 1241);
    			attr_dev(a1, "href", "http://www.bodotika.fr");
    			set_style(a1, "color", "rgb(7, 130, 193)");
    			set_style(a1, "font-family", "sans-serif, Arial, Verdana");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 26, 46, 1347);
    			add_location(strong2, file$1, 26, 220, 1521);
    			add_location(strong3, file$1, 26, 241, 1542);
    			set_style(p2, "text-align", "justify");
    			add_location(p2, file$1, 26, 8, 1309);
    			add_location(strong4, file$1, 28, 38, 1625);
    			add_location(strong5, file$1, 28, 63, 1650);
    			add_location(br1, file$1, 28, 81, 1668);
    			add_location(strong6, file$1, 29, 12, 1687);
    			add_location(strong7, file$1, 29, 46, 1721);
    			add_location(strong8, file$1, 29, 64, 1739);
    			add_location(strong9, file$1, 29, 95, 1770);
    			set_style(p3, "text-align", "justify");
    			add_location(p3, file$1, 28, 8, 1595);
    			add_location(strong10, file$1, 31, 38, 1841);
    			add_location(strong11, file$1, 31, 127, 1930);
    			add_location(br2, file$1, 31, 163, 1966);
    			add_location(strong12, file$1, 32, 69, 2042);
    			add_location(strong13, file$1, 32, 128, 2101);
    			add_location(strong14, file$1, 32, 146, 2119);
    			add_location(strong15, file$1, 32, 177, 2150);
    			set_style(p4, "text-align", "justify");
    			add_location(p4, file$1, 31, 8, 1811);
    			add_location(strong16, file$1, 34, 70, 2244);
    			add_location(br3, file$1, 34, 100, 2274);
    			add_location(strong17, file$1, 35, 47, 2328);
    			add_location(br4, file$1, 35, 84, 2365);
    			add_location(br5, file$1, 36, 13, 2385);
    			add_location(strong18, file$1, 37, 43, 2435);
    			add_location(br6, file$1, 37, 77, 2469);
    			add_location(strong19, file$1, 38, 57, 2533);
    			set_style(p5, "text-align", "justify");
    			add_location(p5, file$1, 34, 8, 2182);
    			set_style(p6, "text-align", "justify");
    			add_location(p6, file$1, 40, 8, 2583);
    			add_location(strong20, file$1, 42, 38, 2658);
    			set_style(p7, "text-align", "justify");
    			add_location(p7, file$1, 42, 8, 2628);
    			add_location(strong21, file$1, 44, 62, 2754);
    			add_location(br7, file$1, 44, 128, 2820);
    			add_location(strong22, file$1, 45, 15, 2842);
    			add_location(u, file$1, 45, 12, 2839);
    			attr_dev(a2, "href", "https://www.generer-mentions-legales.com");
    			add_location(a2, file$1, 45, 97, 2924);
    			add_location(strong23, file$1, 45, 89, 2916);
    			add_location(br8, file$1, 45, 177, 3004);
    			attr_dev(a3, "href", "http://www.patinoire.biz/p+patinoire-de-lyon---charlemagne+113.html");
    			add_location(a3, file$1, 46, 35, 3046);
    			add_location(strong24, file$1, 46, 27, 3038);
    			set_style(p8, "text-align", "justify");
    			add_location(p8, file$1, 44, 8, 2700);
    			set_style(p9, "text-align", "justify");
    			add_location(p9, file$1, 48, 8, 3165);
    			add_location(strong25, file$1, 50, 38, 3240);
    			set_style(p10, "text-align", "justify");
    			add_location(p10, file$1, 50, 8, 3210);
    			attr_dev(a4, "href", "http://www.bodotika.fr");
    			set_style(a4, "text-align", "justify");
    			attr_dev(a4, "target", "_blank");
    			add_location(a4, file$1, 52, 46, 3341);
    			attr_dev(a5, "href", "http://www.bodotika.fr");
    			set_style(a5, "text-align", "justify");
    			attr_dev(a5, "target", "_blank");
    			add_location(a5, file$1, 52, 292, 3587);
    			attr_dev(a6, "href", "http://www.bodotika.fr");
    			set_style(a6, "text-align", "justify");
    			attr_dev(a6, "target", "_blank");
    			add_location(a6, file$1, 52, 696, 3991);
    			set_style(p11, "text-align", "justify");
    			add_location(p11, file$1, 52, 8, 3303);
    			add_location(strong26, file$1, 54, 11, 4289);
    			add_location(p12, file$1, 54, 8, 4286);
    			add_location(p13, file$1, 56, 8, 4360);
    			add_location(strong27, file$1, 58, 11, 5119);
    			add_location(p14, file$1, 58, 8, 5116);
    			attr_dev(a7, "href", "http://www.bodotika.fr");
    			set_style(a7, "text-align", "justify");
    			attr_dev(a7, "target", "_blank");
    			add_location(a7, file$1, 60, 19, 5189);
    			attr_dev(a8, "href", "http://www.bodotika.fr");
    			set_style(a8, "text-align", "justify");
    			attr_dev(a8, "target", "_blank");
    			add_location(a8, file$1, 60, 544, 5714);
    			add_location(p15, file$1, 60, 8, 5178);
    			add_location(strong28, file$1, 62, 11, 6915);
    			add_location(p16, file$1, 62, 8, 6912);
    			attr_dev(a9, "href", "http://www.bodotika.fr");
    			set_style(a9, "text-align", "justify");
    			attr_dev(a9, "target", "_blank");
    			add_location(a9, file$1, 64, 80, 7090);
    			add_location(p17, file$1, 64, 8, 7018);
    			attr_dev(a10, "href", "http://www.bodotika.fr");
    			set_style(a10, "text-align", "justify");
    			attr_dev(a10, "target", "_blank");
    			add_location(a10, file$1, 66, 23, 7432);
    			attr_dev(a11, "href", "http://www.bodotika.fr");
    			set_style(a11, "text-align", "justify");
    			attr_dev(a11, "target", "_blank");
    			add_location(a11, file$1, 66, 275, 7684);
    			attr_dev(a12, "href", "http://www.bodotika.fr");
    			set_style(a12, "text-align", "justify");
    			attr_dev(a12, "target", "_blank");
    			add_location(a12, file$1, 66, 546, 7955);
    			attr_dev(a13, "href", "http://www.bodotika.fr");
    			set_style(a13, "text-align", "justify");
    			attr_dev(a13, "target", "_blank");
    			add_location(a13, file$1, 66, 1017, 8426);
    			add_location(p18, file$1, 66, 8, 7417);
    			attr_dev(a14, "href", "http://www.bodotika.fr");
    			set_style(a14, "text-align", "justify");
    			attr_dev(a14, "target", "_blank");
    			add_location(a14, file$1, 68, 67, 8823);
    			attr_dev(a15, "href", "http://www.bodotika.fr");
    			set_style(a15, "text-align", "justify");
    			attr_dev(a15, "target", "_blank");
    			add_location(a15, file$1, 68, 319, 9075);
    			attr_dev(a16, "href", "http://www.bodotika.fr");
    			set_style(a16, "text-align", "justify");
    			attr_dev(a16, "target", "_blank");
    			add_location(a16, file$1, 68, 665, 9421);
    			add_location(p19, file$1, 68, 8, 8764);
    			attr_dev(a17, "href", "http://www.bodotika.fr");
    			set_style(a17, "text-align", "justify");
    			attr_dev(a17, "target", "_blank");
    			add_location(a17, file$1, 70, 19, 9544);
    			add_location(p20, file$1, 70, 8, 9533);
    			add_location(p21, file$1, 72, 8, 9733);
    			attr_dev(div3, "class", "container");
    			set_style(div3, "padding-top", "4em");
    			add_location(div3, file$1, 18, 4, 744);
    			attr_dev(main, "class", "svelte-1asvw9u");
    			add_location(main, file$1, 8, 0, 174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(h10, span0);
    			append_dev(h10, span1);
    			append_dev(h10, span2);
    			append_dev(span2, t2);
    			append_dev(span2, b);
    			append_dev(span2, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, i);
    			append_dev(main, t6);
    			append_dev(main, div3);
    			append_dev(div3, h11);
    			append_dev(div3, t8);
    			append_dev(div3, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, br0);
    			append_dev(p0, t10);
    			append_dev(p0, a0);
    			append_dev(p0, t12);
    			append_dev(div3, t13);
    			append_dev(div3, p1);
    			append_dev(p1, strong1);
    			append_dev(div3, t15);
    			append_dev(div3, p2);
    			append_dev(p2, t16);
    			append_dev(p2, a1);
    			append_dev(p2, t18);
    			append_dev(p2, strong2);
    			append_dev(p2, strong3);
    			append_dev(p2, t21);
    			append_dev(div3, t22);
    			append_dev(div3, p3);
    			append_dev(p3, strong4);
    			append_dev(p3, strong5);
    			append_dev(p3, br1);
    			append_dev(p3, t25);
    			append_dev(p3, strong6);
    			append_dev(p3, t27);
    			append_dev(p3, strong7);
    			append_dev(p3, strong8);
    			append_dev(p3, t30);
    			append_dev(p3, strong9);
    			append_dev(div3, t32);
    			append_dev(div3, p4);
    			append_dev(p4, strong10);
    			append_dev(p4, strong11);
    			append_dev(p4, br2);
    			append_dev(p4, t35);
    			append_dev(p4, strong12);
    			append_dev(p4, t37);
    			append_dev(p4, strong13);
    			append_dev(p4, strong14);
    			append_dev(p4, strong15);
    			append_dev(div3, t41);
    			append_dev(div3, p5);
    			append_dev(p5, t42);
    			append_dev(p5, strong16);
    			append_dev(p5, br3);
    			append_dev(p5, t44);
    			append_dev(p5, strong17);
    			append_dev(p5, t46);
    			append_dev(p5, br4);
    			append_dev(p5, t47);
    			append_dev(p5, br5);
    			append_dev(p5, t48);
    			append_dev(p5, strong18);
    			append_dev(p5, br6);
    			append_dev(p5, t50);
    			append_dev(p5, strong19);
    			append_dev(div3, t52);
    			append_dev(div3, p6);
    			append_dev(div3, t54);
    			append_dev(div3, p7);
    			append_dev(p7, strong20);
    			append_dev(div3, t56);
    			append_dev(div3, p8);
    			append_dev(p8, t57);
    			append_dev(p8, strong21);
    			append_dev(p8, br7);
    			append_dev(p8, t59);
    			append_dev(p8, u);
    			append_dev(u, strong22);
    			append_dev(p8, t61);
    			append_dev(p8, strong23);
    			append_dev(strong23, a2);
    			append_dev(p8, br8);
    			append_dev(p8, t63);
    			append_dev(p8, strong24);
    			append_dev(strong24, a3);
    			append_dev(div3, t65);
    			append_dev(div3, p9);
    			append_dev(div3, t67);
    			append_dev(div3, p10);
    			append_dev(p10, strong25);
    			append_dev(div3, t69);
    			append_dev(div3, p11);
    			append_dev(p11, t70);
    			append_dev(p11, a4);
    			append_dev(p11, t72);
    			append_dev(p11, a5);
    			append_dev(p11, t74);
    			append_dev(p11, a6);
    			append_dev(p11, t76);
    			append_dev(div3, t77);
    			append_dev(div3, p12);
    			append_dev(p12, strong26);
    			append_dev(div3, t79);
    			append_dev(div3, p13);
    			append_dev(div3, t81);
    			append_dev(div3, p14);
    			append_dev(p14, strong27);
    			append_dev(div3, t83);
    			append_dev(div3, p15);
    			append_dev(p15, t84);
    			append_dev(p15, a7);
    			append_dev(p15, t86);
    			append_dev(p15, a8);
    			append_dev(p15, t88);
    			append_dev(div3, t89);
    			append_dev(div3, p16);
    			append_dev(p16, strong28);
    			append_dev(div3, t91);
    			append_dev(div3, p17);
    			append_dev(p17, t92);
    			append_dev(p17, a9);
    			append_dev(p17, t94);
    			append_dev(div3, t95);
    			append_dev(div3, p18);
    			append_dev(p18, t96);
    			append_dev(p18, a10);
    			append_dev(p18, t98);
    			append_dev(p18, a11);
    			append_dev(p18, t100);
    			append_dev(p18, a12);
    			append_dev(p18, t102);
    			append_dev(p18, a13);
    			append_dev(p18, t104);
    			append_dev(div3, t105);
    			append_dev(div3, p19);
    			append_dev(p19, t106);
    			append_dev(p19, a14);
    			append_dev(p19, t108);
    			append_dev(p19, a15);
    			append_dev(p19, t110);
    			append_dev(p19, a16);
    			append_dev(p19, t112);
    			append_dev(div3, t113);
    			append_dev(div3, p20);
    			append_dev(p20, t114);
    			append_dev(p20, a17);
    			append_dev(p20, t116);
    			append_dev(div3, t117);
    			append_dev(div3, p21);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*keydown_handler*/ ctx[1], false, false, false),
    					listen_dev(i, "click", /*click_handler*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!main_transition) main_transition = create_bidirectional_transition(main, slide, { duration: 700 }, true);
    				main_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!main_transition) main_transition = create_bidirectional_transition(main, slide, { duration: 700 }, false);
    			main_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching && main_transition) main_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MentionLegales", slots, []);
    	let { clicked } = $$props;
    	const writable_props = ["clicked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MentionLegales> was created with unknown prop '${key}'`);
    	});

    	const keydown_handler = e => {
    		if (e.key === "Escape") $$invalidate(0, clicked = !clicked);
    	};

    	const click_handler = () => {
    		$$invalidate(0, clicked = !clicked);
    	};

    	$$self.$$set = $$props => {
    		if ("clicked" in $$props) $$invalidate(0, clicked = $$props.clicked);
    	};

    	$$self.$capture_state = () => ({ slide, clicked });

    	$$self.$inject_state = $$props => {
    		if ("clicked" in $$props) $$invalidate(0, clicked = $$props.clicked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clicked, keydown_handler, click_handler];
    }

    class MentionLegales extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { clicked: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MentionLegales",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*clicked*/ ctx[0] === undefined && !("clicked" in props)) {
    			console.warn("<MentionLegales> was created without expected prop 'clicked'");
    		}
    	}

    	get clicked() {
    		throw new Error("<MentionLegales>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clicked(value) {
    		throw new Error("<MentionLegales>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.38.3 */
    const file = "src/Footer.svelte";

    // (10:4) {#if clicked}
    function create_if_block(ctx) {
    	let mentionlegales;
    	let updating_clicked;
    	let current;

    	function mentionlegales_clicked_binding(value) {
    		/*mentionlegales_clicked_binding*/ ctx[1](value);
    	}

    	let mentionlegales_props = {};

    	if (/*clicked*/ ctx[0] !== void 0) {
    		mentionlegales_props.clicked = /*clicked*/ ctx[0];
    	}

    	mentionlegales = new MentionLegales({
    			props: mentionlegales_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(mentionlegales, "clicked", mentionlegales_clicked_binding));

    	const block = {
    		c: function create() {
    			create_component(mentionlegales.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mentionlegales, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const mentionlegales_changes = {};

    			if (!updating_clicked && dirty & /*clicked*/ 1) {
    				updating_clicked = true;
    				mentionlegales_changes.clicked = /*clicked*/ ctx[0];
    				add_flush_callback(() => updating_clicked = false);
    			}

    			mentionlegales.$set(mentionlegales_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mentionlegales.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mentionlegales.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mentionlegales, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:4) {#if clicked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let div;
    	let h1;
    	let span0;
    	let span1;
    	let span2;
    	let t3;
    	let b;
    	let t5;
    	let span4;
    	let t6;
    	let span3;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*clicked*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Bodotika";
    			span1 = element("span");
    			span1.textContent = "Bureau de création et d'édition _ ";
    			span2 = element("span");
    			t3 = text("Avignon\n            ");
    			b = element("b");
    			b.textContent = "/";
    			t5 = text(" Saint-Etienne");
    			span4 = element("span");
    			t6 = text("_\n            ");
    			span3 = element("span");
    			span3.textContent = "Mentions Legales";
    			t8 = text(" _\n            Notre site ne collecte pas d’informations et\n            n’utilise pas de cookies.");
    			attr_dev(span0, "class", "svelte-1lpntjv");
    			add_location(span0, file, 15, 12, 230);
    			attr_dev(span1, "class", "svelte-1lpntjv");
    			add_location(span1, file, 15, 33, 251);
    			set_style(b, "font-weight", "500");
    			set_style(b, "color", "rgba(0, 0, 0, 0.78)");
    			set_style(b, "font-size", "11px");
    			add_location(b, file, 16, 12, 324);
    			attr_dev(span2, "class", "svelte-1lpntjv");
    			add_location(span2, file, 15, 80, 298);
    			attr_dev(span3, "class", "mt svelte-1lpntjv");
    			add_location(span3, file, 17, 12, 444);
    			attr_dev(span4, "class", "svelte-1lpntjv");
    			add_location(span4, file, 16, 112, 424);
    			attr_dev(h1, "class", "svelte-1lpntjv");
    			add_location(h1, file, 14, 8, 213);
    			attr_dev(div, "class", "title svelte-1lpntjv");
    			add_location(div, file, 13, 4, 185);
    			attr_dev(main, "class", "svelte-1lpntjv");
    			add_location(main, file, 7, 0, 105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(h1, span0);
    			append_dev(h1, span1);
    			append_dev(h1, span2);
    			append_dev(span2, t3);
    			append_dev(span2, b);
    			append_dev(span2, t5);
    			append_dev(h1, span4);
    			append_dev(span4, t6);
    			append_dev(span4, span3);
    			append_dev(span4, t8);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span3, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*clicked*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*clicked*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let clicked = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	function mentionlegales_clicked_binding(value) {
    		clicked = value;
    		$$invalidate(0, clicked);
    	}

    	const click_handler = () => {
    		if (clicked) return;
    		$$invalidate(0, clicked = !clicked);
    	};

    	$$self.$capture_state = () => ({ MentionLegales, clicked });

    	$$self.$inject_state = $$props => {
    		if ("clicked" in $$props) $$invalidate(0, clicked = $$props.clicked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clicked, mentionlegales_clicked_binding, click_handler];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.3 */

    function create_fragment(ctx) {
    	let title;
    	let t0;
    	let devise;
    	let t1;
    	let arrow;
    	let t2;
    	let stats;
    	let t3;
    	let insta;
    	let t4;
    	let clients;
    	let t5;
    	let footer;
    	let current;
    	title = new Title({ $$inline: true });
    	devise = new Devise({ $$inline: true });
    	arrow = new Arrow({ $$inline: true });
    	stats = new Stats({ $$inline: true });
    	insta = new Insta({ $$inline: true });
    	clients = new Clients({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(devise.$$.fragment);
    			t1 = space();
    			create_component(arrow.$$.fragment);
    			t2 = space();
    			create_component(stats.$$.fragment);
    			t3 = space();
    			create_component(insta.$$.fragment);
    			t4 = space();
    			create_component(clients.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(devise, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(arrow, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(stats, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(insta, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(clients, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(devise.$$.fragment, local);
    			transition_in(arrow.$$.fragment, local);
    			transition_in(stats.$$.fragment, local);
    			transition_in(insta.$$.fragment, local);
    			transition_in(clients.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(devise.$$.fragment, local);
    			transition_out(arrow.$$.fragment, local);
    			transition_out(stats.$$.fragment, local);
    			transition_out(insta.$$.fragment, local);
    			transition_out(clients.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(devise, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(arrow, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(stats, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(insta, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(clients, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Title,
    		Devise,
    		Arrow,
    		Stats,
    		Insta,
    		Clients,
    		Footer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
