/* Виртуальный стенд: файловая система, процессы, systemd, сеть и HTTP-API
   учебного узла ядра мобильной сети. Один и тот же стенд видят и консоль Linux,
   и модуль requests в Python — как на настоящей работе. */
(function (root) {
  'use strict';

  /* ─────────── файловая система ─────────── */

  function FS(tree) {
    this.root = tree || { type: 'dir', children: {} };
  }

  FS.prototype.split = function (path) {
    return String(path).split('/').filter(function (p) { return p !== '' && p !== '.'; });
  };

  FS.prototype.resolve = function (cwd, path) {
    path = String(path == null ? '' : path);
    var parts;
    if (path[0] === '/') parts = this.split(path);
    else if (path === '~' || path.indexOf('~/') === 0) parts = this.split('/home/qa/' + path.slice(1));
    else parts = this.split(cwd + '/' + path);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === '..') out.pop();
      else out.push(parts[i]);
    }
    return '/' + out.join('/');
  };

  FS.prototype.node = function (abspath) {
    var parts = this.split(abspath);
    var cur = this.root;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || cur.type !== 'dir' || !cur.children[parts[i]]) return null;
      cur = cur.children[parts[i]];
    }
    return cur;
  };

  FS.prototype.parent = function (abspath) {
    var parts = this.split(abspath);
    parts.pop();
    return this.node('/' + parts.join('/'));
  };

  FS.prototype.baseName = function (abspath) {
    var parts = this.split(abspath);
    return parts.length ? parts[parts.length - 1] : '/';
  };

  FS.prototype.readFile = function (abspath) {
    var n = this.node(abspath);
    if (!n || n.type !== 'file') return null;
    return n.content == null ? '' : n.content;
  };

  FS.prototype.writeFile = function (abspath, text) {
    var p = this.parent(abspath);
    if (!p) return false;
    var name = this.baseName(abspath);
    if (p.children[name] && p.children[name].type === 'dir') return false;
    p.children[name] = p.children[name] || { type: 'file', mode: '-rw-r--r--', owner: 'qa', group: 'qa', mtime: 'авг 16 10:00' };
    p.children[name].content = text;
    return true;
  };

  FS.prototype.mkdir = function (abspath) {
    var p = this.parent(abspath);
    if (!p) return false;
    var name = this.baseName(abspath);
    if (p.children[name]) return false;
    p.children[name] = { type: 'dir', children: {}, mode: 'drwxr-xr-x', owner: 'qa', group: 'qa', mtime: 'авг 16 10:00' };
    return true;
  };

  FS.prototype.remove = function (abspath) {
    var p = this.parent(abspath);
    var name = this.baseName(abspath);
    if (!p || !p.children[name]) return false;
    delete p.children[name];
    return true;
  };

  FS.prototype.list = function (abspath) {
    var n = this.node(abspath);
    if (!n) return null;
    if (n.type === 'file') return [{ name: this.baseName(abspath), node: n }];
    return Object.keys(n.children).sort().map(function (k) { return { name: k, node: n.children[k] }; });
  };

  FS.prototype.size = function (node) {
    if (node.type === 'dir') return 4096;
    if (node.size != null) return node.size;
    return (node.content || '').length;
  };

  /* ─────────── сборка стенда ─────────── */

  function file(content, extra) {
    var f = { type: 'file', content: content, mode: '-rw-r--r--', owner: 'root', group: 'root', mtime: 'авг 16 09:12' };
    for (var k in (extra || {})) f[k] = extra[k];
    return f;
  }
  function dir(children, extra) {
    var d = { type: 'dir', children: children || {}, mode: 'drwxr-xr-x', owner: 'root', group: 'root', mtime: 'авг 16 09:12' };
    for (var k in (extra || {})) d[k] = extra[k];
    return d;
  }

  var CORE_CONF = [
    '# конфигурация учебного узла регистрации абонентов',
    'listen_address = 0.0.0.0',
    'listen_port = 8080',
    'database_host = db.core.local',
    'database_port = 5432',
    'database_timeout = 3',
    'log_level = INFO',
    'log_file = /var/log/core/registrar.log',
    'max_sessions = 1000',
    ''
  ].join('\n');

  var SUBSCRIBERS = [
    'imsi;msisdn;status;plan',
    '250010000000001;79001112233;active;smart',
    '250010000000002;79001112234;active;basic',
    '250010000000003;79001112235;blocked;smart',
    '250010000000004;79001112236;active;unlimited',
    '250010000000005;79001112237;suspended;basic',
    ''
  ].join('\n');

  var REGISTRAR_LOG = [
    '2026-08-16 09:00:01 INFO  registrar started, listening on 0.0.0.0:8080',
    '2026-08-16 09:00:01 INFO  database connection established db.core.local:5432',
    '2026-08-16 09:01:12 INFO  imsi=250010000000001 registration successful session=a1f3',
    '2026-08-16 09:01:44 INFO  imsi=250010000000002 registration successful session=a1f4',
    '2026-08-16 09:02:03 WARN  imsi=250010000000003 subscriber blocked, registration rejected',
    '2026-08-16 09:03:19 INFO  imsi=250010000000004 registration successful session=a1f5',
    '2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber',
    '2026-08-16 09:05:31 INFO  imsi=250010000000001 session released session=a1f3',
    '2026-08-16 09:06:02 ERROR database timeout after 3s, request dropped',
    '2026-08-16 09:06:03 WARN  retry 1 of 3 for imsi=250010000000002',
    '2026-08-16 09:06:05 INFO  imsi=250010000000002 registration successful session=a1f6',
    '2026-08-16 09:07:41 INFO  health check ok',
    ''
  ].join('\n');

  function buildFS() {
    return new FS(dir({
      etc: dir({
        core: dir({
          'registrar.conf': file(CORE_CONF),
          'subscribers.csv': file(SUBSCRIBERS)
        }),
        hosts: file('127.0.0.1 localhost\n10.10.0.10 core-node core-node.lab\n10.10.0.20 db.core.local\n'),
        'resolv.conf': file('nameserver 10.10.0.1\nsearch core.local\n'),
        passwd: file('root:x:0:0:root:/root:/bin/bash\nqa:x:1000:1000:QA engineer:/home/qa:/bin/bash\ncore:x:998:998:core service:/var/lib/core:/usr/sbin/nologin\n')
      }),
      var: dir({
        log: dir({
          core: dir({
            'registrar.log': file(REGISTRAR_LOG),
            'registrar.log.1': file('2026-08-15 21:10:04 INFO  registrar started\n2026-08-15 23:59:59 INFO  daily rotation\n')
          }),
          syslog: file('2026-08-16 09:00:00 core-node systemd[1]: Started Core Registrar Service.\n2026-08-16 09:06:02 core-node registrar[812]: database timeout after 3s\n')
        }),
        lib: dir({ core: dir({}) })
      }),
      home: dir({
        qa: dir({
          'readme.txt': file('Стенд учебного ядра.\nСервис: core-registrar, порт 8080.\nЛоги: /var/log/core/registrar.log\n', { owner: 'qa', group: 'qa' }),
          tests: dir({}, { owner: 'qa', group: 'qa' })
        }, { owner: 'qa', group: 'qa', mode: 'drwxr-xr-x' })
      }),
      opt: dir({
        core: dir({
          bin: dir({ registrar: file('#!/bin/sh\n# бинарь сервиса (заглушка)\n', { mode: '-rwxr-xr-x', size: 8421376 }) })
        })
      }),
      root: dir({}, { mode: 'drwx------' }),
      tmp: dir({}, { mode: 'drwxrwxrwt' })
    }));
  }

  /* ─────────── состояние стенда ─────────── */

  function Stand(scenario) {
    this.scenario = scenario || 'ok';
    this.fs = buildFS();
    this.cwd = '/home/qa';
    this.user = 'qa';
    this.host = 'core-node';
    this.env = { HOME: '/home/qa', USER: 'qa', PATH: '/usr/local/bin:/usr/bin:/bin', SHELL: '/bin/bash', PWD: '/home/qa' };
    this.history = [];

    this.services = {
      'core-registrar': {
        desc: 'Core Registrar Service',
        active: true, enabled: true, pid: 812, since: 'Sat 2026-08-16 09:00:01 MSK',
        mem: '84.2M', exec: '/opt/core/bin/registrar --config /etc/core/registrar.conf',
        log: '/var/log/core/registrar.log'
      },
      'core-db': {
        desc: 'Core Database Proxy',
        active: true, enabled: true, pid: 640, since: 'Sat 2026-08-16 08:59:40 MSK',
        mem: '32.0M', exec: '/usr/bin/db-proxy'
      },
      ssh: { desc: 'OpenBSD Secure Shell server', active: true, enabled: true, pid: 512, since: 'Sat 2026-08-16 08:59:12 MSK', mem: '6.1M', exec: '/usr/sbin/sshd -D' }
    };

    this.processes = [
      { pid: 1, user: 'root', cpu: 0.0, mem: 0.3, cmd: '/sbin/init' },
      { pid: 512, user: 'root', cpu: 0.0, mem: 0.4, cmd: '/usr/sbin/sshd -D' },
      { pid: 640, user: 'core', cpu: 0.7, mem: 1.9, cmd: '/usr/bin/db-proxy' },
      { pid: 812, user: 'core', cpu: 2.3, mem: 4.8, cmd: '/opt/core/bin/registrar --config /etc/core/registrar.conf' },
      { pid: 1043, user: 'qa', cpu: 0.0, mem: 0.2, cmd: '-bash' }
    ];

    this.sockets = [
      { proto: 'tcp', state: 'LISTEN', local: '0.0.0.0:8080', peer: '0.0.0.0:*', pid: 812, prog: 'registrar' },
      { proto: 'tcp', state: 'LISTEN', local: '0.0.0.0:22', peer: '0.0.0.0:*', pid: 512, prog: 'sshd' },
      { proto: 'tcp', state: 'LISTEN', local: '127.0.0.1:5432', peer: '0.0.0.0:*', pid: 640, prog: 'db-proxy' },
      { proto: 'udp', state: 'UNCONN', local: '0.0.0.0:68', peer: '0.0.0.0:*', pid: 402, prog: 'dhclient' }
    ];

    this.interfaces = [
      { name: 'lo', state: 'UNKNOWN', addr: '127.0.0.1/8', mac: '00:00:00:00:00:00' },
      { name: 'eth0', state: 'UP', addr: '10.10.0.10/24', mac: '52:54:00:a1:b2:c3' }
    ];
    this.routes = ['default via 10.10.0.1 dev eth0 proto static metric 100', '10.10.0.0/24 dev eth0 proto kernel scope link src 10.10.0.10'];

    this.dns = {
      'core-node.lab': '10.10.0.10',
      'db.core.local': '10.10.0.20',
      'localhost': '127.0.0.1'
    };

    this.firewall = { enabled: false, blocked: [] };
    this.disk = { total: '20G', used: '6.4G', avail: '12G', usePct: 35 };
    this.memory = { total: 3936, used: 812, free: 2210, cache: 914 };

    this.subscribers = [
      { imsi: '250010000000001', msisdn: '79001112233', status: 'active', plan: 'smart' },
      { imsi: '250010000000002', msisdn: '79001112234', status: 'active', plan: 'basic' },
      { imsi: '250010000000003', msisdn: '79001112235', status: 'blocked', plan: 'smart' },
      { imsi: '250010000000004', msisdn: '79001112236', status: 'active', plan: 'unlimited' },
      { imsi: '250010000000005', msisdn: '79001112237', status: 'suspended', plan: 'basic' }
    ];
    this.sessions = {};
    this.apiCalls = [];
    this.dbUp = true;

    applyScenario(this, this.scenario);
  }

  /* Сценарии поломок — на них строятся задания «найди причину». */
  function applyScenario(st, name) {
    if (name === 'ok') return;

    if (name === 'service-down') {
      // сервис упал из-за опечатки в конфиге
      st.services['core-registrar'].active = false;
      st.services['core-registrar'].pid = null;
      st.services['core-registrar'].failed = 'Process exited, code=exited, status=1/FAILURE';
      st.processes = st.processes.filter(function (p) { return p.pid !== 812; });
      st.sockets = st.sockets.filter(function (s) { return s.pid !== 812; });
      st.fs.writeFile('/etc/core/registrar.conf', CORE_CONF.replace('listen_port = 8080', 'listen_port = 80o8'));
      st.fs.writeFile('/var/log/core/registrar.log', st.fs.readFile('/var/log/core/registrar.log') +
        '2026-08-16 10:12:04 ERROR invalid value for listen_port: "80o8"\n' +
        '2026-08-16 10:12:04 FATAL configuration error, shutting down\n');
      return;
    }

    if (name === 'wrong-bind') {
      // сервис жив, но слушает только localhost — снаружи не достучаться
      st.sockets = st.sockets.map(function (s) {
        if (s.pid === 812) s.local = '127.0.0.1:8080';
        return s;
      });
      st.fs.writeFile('/etc/core/registrar.conf', CORE_CONF.replace('listen_address = 0.0.0.0', 'listen_address = 127.0.0.1'));
      st.bindLocalOnly = true;
      return;
    }

    if (name === 'firewall') {
      st.firewall.enabled = true;
      st.firewall.blocked = [8080];
      return;
    }

    if (name === 'db-down') {
      st.dbUp = false;
      st.services['core-db'].active = false;
      st.services['core-db'].pid = null;
      st.processes = st.processes.filter(function (p) { return p.pid !== 640; });
      st.sockets = st.sockets.filter(function (s) { return s.pid !== 640; });
      st.fs.writeFile('/var/log/core/registrar.log', st.fs.readFile('/var/log/core/registrar.log') +
        '2026-08-16 10:20:11 ERROR database timeout after 3s, request dropped\n' +
        '2026-08-16 10:20:14 ERROR database timeout after 3s, request dropped\n' +
        '2026-08-16 10:20:17 ERROR connection refused to db.core.local:5432\n');
      return;
    }

    if (name === 'disk-full') {
      st.disk = { total: '20G', used: '20G', avail: '0', usePct: 100 };
      st.fs.writeFile('/var/log/core/registrar.log', st.fs.readFile('/var/log/core/registrar.log') +
        '2026-08-16 10:31:00 ERROR cannot write log: No space left on device\n');
      var big = st.fs.node('/var/log/core');
      big.children['registrar.log.old'] = file('', { size: 13958643712, mtime: 'авг 10 03:00' });
      return;
    }

    if (name === 'dns-broken') {
      delete st.dns['db.core.local'];
      st.dbUp = false;
      st.fs.writeFile('/var/log/core/registrar.log', st.fs.readFile('/var/log/core/registrar.log') +
        '2026-08-16 10:41:07 ERROR name resolution failed for db.core.local\n');
      return;
    }

    if (name === 'port-conflict') {
      st.services['core-registrar'].active = false;
      st.services['core-registrar'].pid = null;
      st.services['core-registrar'].failed = 'Process exited, code=exited, status=98/ADDRINUSE';
      st.processes = st.processes.filter(function (p) { return p.pid !== 812; });
      st.processes.push({ pid: 1180, user: 'root', cpu: 0.1, mem: 1.1, cmd: '/usr/sbin/nginx -g daemon off;' });
      st.sockets = st.sockets.map(function (s) {
        if (s.pid === 812) { s.pid = 1180; s.prog = 'nginx'; }
        return s;
      });
      st.fs.writeFile('/var/log/core/registrar.log', st.fs.readFile('/var/log/core/registrar.log') +
        '2026-08-16 10:50:22 ERROR bind to 0.0.0.0:8080 failed: Address already in use\n');
      return;
    }
  }

  /* ─────────── HTTP-API учебного узла ─────────── */

  Stand.prototype.reachable = function (host, port) {
    var svc = this.services['core-registrar'];
    var isLocal = host === '127.0.0.1' || host === 'localhost';
    if (port !== 8080) return { ok: false, reason: 'refused' };
    if (!svc.active) return { ok: false, reason: 'refused' };
    if (this.firewall.enabled && this.firewall.blocked.indexOf(port) >= 0 && !isLocal) {
      return { ok: false, reason: 'timeout' };
    }
    if (this.bindLocalOnly && !isLocal) return { ok: false, reason: 'refused' };
    if (!isLocal && !this.dns[host] && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return { ok: false, reason: 'dns' };
    }
    return { ok: true };
  };

  // возвращает {status, body(object|string), headers, error}
  Stand.prototype.http = function (method, host, port, path, body) {
    var conn = this.reachable(host, port);
    if (!conn.ok) return { error: conn.reason };

    this.apiCalls.push({ method: method, path: path, body: body });
    var self = this;

    if (path === '/health' || path === '/api/health') {
      return { status: 200, body: { status: this.dbUp ? 'ok' : 'degraded', database: this.dbUp ? 'up' : 'down', uptime: 4210 } };
    }

    if (path === '/api/subscribers' && method === 'GET') {
      return { status: 200, body: { count: this.subscribers.length, items: this.subscribers.slice() } };
    }

    var m = /^\/api\/subscribers\/(\d+)$/.exec(path);
    if (m && method === 'GET') {
      var found = this.subscribers.filter(function (s) { return s.imsi === m[1]; })[0];
      if (!found) return { status: 404, body: { error: 'unknown subscriber' } };
      return { status: 200, body: found };
    }

    if (path === '/api/registration' && method === 'POST') {
      if (!this.dbUp) {
        this.appendLog('ERROR database timeout after 3s, request dropped');
        return { status: 503, body: { error: 'database unavailable' } };
      }
      var imsi = body && body.imsi;
      if (imsi === undefined || imsi === null || imsi === '') {
        return { status: 400, body: { error: 'imsi is required' } };
      }
      if (typeof imsi !== 'string' || !/^\d{15}$/.test(imsi)) {
        return { status: 400, body: { error: 'invalid imsi format' } };
      }
      var sub = this.subscribers.filter(function (s) { return s.imsi === imsi; })[0];
      if (!sub) {
        this.appendLog('ERROR imsi=' + imsi + ' unknown subscriber');
        return { status: 404, body: { error: 'unknown subscriber' } };
      }
      if (sub.status === 'blocked') {
        this.appendLog('WARN  imsi=' + imsi + ' subscriber blocked, registration rejected');
        return { status: 403, body: { error: 'subscriber blocked' } };
      }
      if (sub.status === 'suspended') {
        this.appendLog('WARN  imsi=' + imsi + ' subscriber suspended');
        return { status: 403, body: { error: 'subscriber suspended' } };
      }
      if (this.sessions[imsi]) {
        return { status: 200, body: { status: 'registered', session_id: this.sessions[imsi], duplicate: true } };
      }
      var sid = 'sess-' + (Object.keys(this.sessions).length + 1);
      this.sessions[imsi] = sid;
      this.appendLog('INFO  imsi=' + imsi + ' registration successful session=' + sid);
      return { status: 200, body: { status: 'registered', session_id: sid, plan: sub.plan } };
    }

    if (path === '/api/sessions' && method === 'GET') {
      var items = Object.keys(this.sessions).map(function (k) { return { imsi: k, session_id: self.sessions[k] }; });
      return { status: 200, body: { count: items.length, items: items } };
    }

    if (/^\/api\/sessions\/(\d+)$/.test(path) && method === 'DELETE') {
      var im = /^\/api\/sessions\/(\d+)$/.exec(path)[1];
      if (!this.sessions[im]) return { status: 404, body: { error: 'session not found' } };
      delete this.sessions[im];
      this.appendLog('INFO  imsi=' + im + ' session released');
      return { status: 200, body: { status: 'released' } };
    }

    return { status: 404, body: { error: 'not found', path: path } };
  };

  Stand.prototype.appendLog = function (line) {
    var path = '/var/log/core/registrar.log';
    var cur = this.fs.readFile(path) || '';
    this.fs.writeFile(path, cur + '2026-08-16 11:00:00 ' + line + '\n');
  };

  Stand.prototype.journal = function (unit) {
    var lines = [];
    var svc = this.services[unit];
    if (!svc) return [];
    lines.push('авг 16 09:00:00 ' + this.host + ' systemd[1]: Starting ' + svc.desc + '...');
    if (unit === 'core-registrar') {
      var log = (this.fs.readFile('/var/log/core/registrar.log') || '').trim().split('\n');
      for (var i = 0; i < log.length; i++) {
        if (!log[i]) continue;
        var parts = log[i].split(/\s+/);
        var rest = log[i].replace(/^\S+\s+\S+\s+/, '');
        lines.push('авг 16 ' + (parts[1] || '09:00:00') + ' ' + this.host + ' registrar[' + (svc.pid || 812) + ']: ' + rest);
      }
    }
    if (!svc.active) {
      lines.push('авг 16 10:12:04 ' + this.host + ' systemd[1]: ' + unit + '.service: ' + (svc.failed || 'Main process exited'));
      lines.push('авг 16 10:12:04 ' + this.host + ' systemd[1]: ' + unit + '.service: Failed with result "exit-code".');
    } else {
      lines.push('авг 16 09:00:01 ' + this.host + ' systemd[1]: Started ' + svc.desc + '.');
    }
    return lines;
  };

  root.CourseStand = { Stand: Stand, FS: FS, buildFS: buildFS, SCENARIOS: ['ok', 'service-down', 'wrong-bind', 'firewall', 'db-down', 'disk-full', 'dns-broken', 'port-conflict'] };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
