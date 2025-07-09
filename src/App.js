// @flow
import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import GPTAssistant from './GPTAssistant';
import ChatWindow from './ChatWindow';



// make sure GPTAssistant.js is in the same folder



function App() {
    const [firewallMinigameVisible, setFirewallMinigameVisible] = useState(false);
    const [portMatches, setPortMatches] = useState({
        22: '',
        80: '',
        443: ''
    });
    const typingIntervalRef = useRef(null);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [tutorialVisible, setTutorialVisible] = useState(true);
    const [currentDir, setCurrentDir] = useState('C:/Users/Student');
    const [aiTip, setAiTip] = useState('Try typing "help" to get started.');
    const canvasRef = useRef(null);
    const [chatLog, setChatLog] = useState([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help?' }
    ]);
    const [theme, setTheme] = useState('matrix');
    const [selectedModel, setSelectedModel] = useState(() => {
        return localStorage.getItem('selectedModel') || 'gpt-3.5-turbo';
    });
    useEffect(() => {
        localStorage.setItem('selectedModel', selectedModel);
    }, [selectedModel]);
    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const letters = '01';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const rainColor = getComputedStyle(document.body).getPropertyValue('--rain-color').trim();
            ctx.fillStyle = rainColor || '#00FF00';
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);
    /** @type {Record<string, string[]>} */
    const [fileSystem, setFileSystem] = useState({
        'C:/Users/Student': ['Documents', 'Downloads', 'Music', 'Pictures'],
        'C:/Users/Student/Documents': ['Resume.docx'],
    });




    const commandParser = (input) => {
        const args = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd = args.shift();
        const flags = {};
        let lastFlag = null;
        args.forEach(arg => {
            if (arg.startsWith('-')) {
                lastFlag = arg.replace(/^-+/, '');
                flags[lastFlag] = true;
            } else if (lastFlag) {
                flags[lastFlag] = arg.replace(/"/g, '');
                lastFlag = null;
            }
        });
        return { cmd, args, flags };
    };

    const getSmartTip = (cmd) => {
        switch (cmd) {
            case 'New-Item':
                return 'Tip: Use -Name to specify the file name. Example: New-Item -Name "notes.txt"';
            case 'cd':
                return 'Tip: Navigate into folders using cd <folder>. Try cd Documents';
            case 'Get-GitHub':
                return 'Tip: Provide a GitHub username. Example: Get-GitHub octocat';
            case 'help':
                return 'Tip: Need more? Try Get-Command to see all available commands';
            case 'Get-Command':
                return 'Tip: Browse all commands and try one like Get-Date or Write-Host';
            case 'echo':
                return 'Tip: Echo just repeats your message back. Try echo Hello, World!';
            default:
                return 'Tip: Type "help" for command suggestions or ask GPT on the right 👉';
        }
    };


    const commandList = {
        'help': () => 'Try commands like dir, cd, New-Item -Path . -Name "file.txt"',
        'dir': () => fileSystem[currentDir]?.map(f => '- ' + f).join('\n') || 'Directory is empty.',
        'echo': ({ args }) => args.join(' '),
        'cls': () => {
            setOutput([]);
            return 'Screen cleared';
        },
        'New-Item': ({ flags }) => {
            const { Name } = flags;
            if (!Name) return 'Missing -Name parameter.';
            fileSystem[currentDir] = fileSystem[currentDir] || [];
            fileSystem[currentDir].push(Name);
            return `Created file: ${Name}`;
        },
        'bypass-firewall': () => {
            return '__LAUNCH_MINIGAME__'; // special flag to open minigame UI
        },
        'Get-Date': () => new Date().toString(),
        'Get-Location': () => currentDir,
        'Get-Random': () => Math.floor(Math.random() * 100),
        'Measure-Object': () => 'Simulated: Measuring object...',
        'ConvertTo-Json': () => 'Simulated: Converted to JSON.',
        'ConvertFrom-Json': () => 'Simulated: Converted from JSON.',
        'Export-Csv': () => 'Simulated: Exported to CSV.',
        'Import-Csv': () => 'Simulated: Imported from CSV.',
        'Sort-Object': () => 'Simulated: Sorted object.',
        'Group-Object': () => 'Simulated: Grouped object.',
        'Where-Object': () => 'Simulated: Filtered object.',
        'ForEach-Object': () => 'Simulated: Looping through objects.',
        'Out-File': () => 'Simulated: Sent output to file.',
        'Read-Host': () => 'Simulated: Prompted user input.',
        'Write-Output': () => 'Simulated: Displayed output.',
        'Write-Host': () => 'Simulated: Wrote directly to host.',
        'New-Guid': () => 'Generated GUID: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        'Start-Sleep': () => 'Simulated: Sleeping...',
        'Get-ChildItem': () => 'Simulated: Child items listed.',
        'Get-Help': () => 'Help: Shows available commands.',
        'Get-EventLog': () => 'Simulated: Accessed event log.',
        'Get-WmiObject': () => 'Simulated: Retrieved WMI object.',
        'Invoke-WebRequest': () => 'Simulated: Web request made.',
        'Get-Service': () => 'Simulated: Service list.',
        'Get-Process': () => 'Simulated: Process list.',
        'Get-Command': () => Object.keys(commandList).join(', '),
        'Get-History': () => 'Simulated: Command history.',
        'Test-Path': () => 'Simulated: Path is valid.',
        'Rename-Item': () => 'Simulated: Item renamed.',
        'Remove-Item': () => 'Simulated: Item removed.',
        'Set-Location': () => 'Simulated: Location set.',
        'Copy-Item': () => 'Simulated: Item copied.',
        'Move-Item': () => 'Simulated: Item moved.',
        'Clear-Variable': () => 'Simulated: Variable cleared.',
        'Clear-Content': () => 'Simulated: Content cleared.',
        'Get-Item': () => 'Simulated: Item fetched.',
        'Add-Content': () => 'Simulated: Content added.',
        'Set-Content': () => 'Simulated: Content set.',
        'Get-GitHub': async ({ args }) => {
            if (!args.length) return '⚠️ Please provide a GitHub username. Example: Get-GitHub octocat';
            const username = args[0];
            try {
                const res = await fetch(`https://api.github.com/users/${username}/repos`);
                if (!res.ok) return `❌ Failed to fetch data for user "${username}".`;
                /** @type {{ name: string, description: string, html_url: string }[]} */
                const repos = await res.json();
                if (!repos.length) return `📭 No public repositories found for "${username}".`;
                return repos.slice(0, 5).map(repo =>
                    `📁 ${repo.name}: ${repo.description || 'No description'}\n🔗 ${repo.html_url}`
                ).join('\n\n');

            } catch (err) {
                return '🚫 Error fetching GitHub repos. Please try again.';
            }
        },
        'nmap': () => 'Simulated: Scanning for open ports on localhost...\nPort 22: open (SSH)\nPort 80: open (HTTP)',
        'whois': ({ args }) => {
            const domain = args[0] || 'example.com';
            return `Simulated WHOIS lookup for ${domain}...\nRegistrar: NameCheap, Inc.\nCreation Date: 2001-03-01\nStatus: Active`;
        },
        'ping': ({ args }) => {
            const target = args[0] || '127.0.0.1';
            return `Simulated: Pinging ${target} with 32 bytes of data:\nReply from ${target}: bytes=32 time=32ms TTL=128\nReply from ${target}: bytes=32 time=31ms TTL=128`;
        },
        'trace-route': ({ args }) => {
            const target = args[0] || '8.8.8.8';
            return `Simulated traceroute to ${target}...\nHop 1: 192.168.1.1\nHop 2: 10.0.0.1\nHop 3: ${target}`;
        },
        'netstat': () => 'Simulated netstat:\nTCP    127.0.0.1:8080    ESTABLISHED\nTCP    127.0.0.1:3000    LISTENING',
        'nslookup': ({ args }) => {
            const domain = args[0] || 'example.com';
            return `Simulated nslookup for ${domain}...\nName: ${domain}\nAddress: 93.184.216.34`;
        },
        'dig': ({ args }) => {
            const domain = args[0] || 'example.com';
            return `Simulated dig for ${domain}...\n;; ANSWER SECTION:\n${domain}. 86400 IN A 93.184.216.34`;
        },
        'sqlmap': ({ args }) => {
            const url = args[0] || 'https://testphp.vulnweb.com';
            return `Simulated: sqlmap scanning ${url} for SQL injection vulnerabilities...\n[INFO] Database: acuart`;
        },
        'setoolkit': () => {
            return 'Simulated: Launching Social-Engineer Toolkit...\nOptions: [1] Social-Engineering Attacks [2] Web Attack Vectors';
        },
        'tcpdump': () => {
            return 'Simulated: Listening for traffic on eth0...\nIP 192.168.1.10.443 > 192.168.1.20.5000: Flags [P], length 100';
        },
        'wipe': ({ args }) => {
            const file = args[0] || 'sensitive.txt';
            return `Simulated: Securely wiping file ${file}... Complete.`;
        },
        'hashcat': () => {
            return 'Simulated: Cracking hashes using hashcat...\n[STATUS] Cracked 1/1 hashes | Speed: 100 H/s';
        },

        'hydra': ({ args }) => {
            const target = args[0] || '192.168.0.100';
            return `🔓 Simulated: Brute-force login on ${target}...\n[INFO] Credential found: admin:password123`;
        },

        'john': () => {
            return '🧠 Simulated: John the Ripper is cracking hashes...\n[+] Hash cracked: password1';
        },

        'msfconsole': () => {
            return '💥 Simulated: Metasploit Console initialized.\n[*] Loaded 200+ exploits. Type `search ms08_067` to begin.';
        },

        'nikto': ({ args }) => {
            const site = args[0] || 'https://example.com';
            return `🕵️ Simulated: Nikto scan for ${site}...\n[+] XSS detected on /search\n[+] Directory listing enabled`;
        },

        'burpsuite': () => {
            return '🛡️ Simulated: Burp Suite started.\n[+] Proxy server running on localhost:8080';
        },

        'mkdir': ({ args }) => {
            const newFolder = args[0];
            if (!newFolder) return '⚠️ Please provide a folder name.';
            const newPath = `${currentDir}/${newFolder}`;
            if (fileSystem[newPath]) return '⚠️ Folder already exists.';

            setFileSystem(prev => ({
                ...prev,
                [currentDir]: [...(prev[currentDir] || []), newFolder],
                [newPath]: []
            }));

            return `📁 Folder created: ${newPath}`;
        },

        'touch': ({ args }) => {
            const fileName = args[0];
            if (!fileName) return '⚠️ Please provide a file name.';
            setFileSystem(prev => ({
                ...prev,
                [currentDir]: [...(prev[currentDir] || []), fileName]
            }));
            return `📄 File created: ${fileName}`;
        },

        'cd': ({ args }) => {
            const path = args[0];
            if (path === '..') {
                const parts = currentDir.split('/');
                if (parts.length <= 3) return '⚠️ Already at root.';
                parts.pop();
                const newDir = parts.join('/');
                setCurrentDir(newDir);
                return `⬆️ Moved up to: ${newDir}`;
            }

            const newPath = `${currentDir}/${path}`;
            if (fileSystem[newPath]) {
                setCurrentDir(newPath);
                return `📂 Changed directory to ${newPath}`;
            }
            return `❌ Directory not found: ${path}`;
        },

        'rm': ({ args }) => {
            const name = args[0];
            if (!name) return '⚠️ Please provide a file or folder name.';

            const fullPath = `${currentDir}/${name}`;
            /**
             * @param {Record<string, string[]>} prev
             */
            setFileSystem((prev: Record<string, string[]>) => {
                const updatedDir = (prev[currentDir] || []).filter(item => item !== name);
                const newFS = { ...prev, [currentDir]: updatedDir };

                if (newFS[fullPath]) delete newFS[fullPath];

                return newFS;
            });

            return `🗑️ Removed: ${name}`;
        },

        'cat': ({ args }) => {
            const file = args[0];
            if (!file) return '⚠️ Provide a file to read.';
            const exists = fileSystem[currentDir]?.includes(file);
            return exists ? `📄 Contents of ${file}: Simulated file data.` : '❌ File not found.';
        },

        'ls': () => fileSystem[currentDir]?.map(f => '- ' + f).join('\n') || '📂 Directory is empty.',




    };
    const powershellCommandGroups = {
        "File System": [
            "ls", "cd", "mkdir", "rm", "touch", "cat"
        ],
        "Info & Utilities": [
            "Get-Date", "Get-Location", "Get-Random", "Measure-Object", "ConvertTo-Json",
            "ConvertFrom-Json", "Export-Csv", "Import-Csv", "Sort-Object", "Group-Object",
            "Where-Object", "ForEach-Object", "Out-File", "Read-Host", "Write-Output",
            "Write-Host", "New-Guid", "Start-Sleep", "Get-ChildItem", "Get-Item"
        ],
        "Networking": [
            "Test-Path", "Invoke-WebRequest"
        ],
        "Process & Services": [
            "Get-Service", "Get-Process", "Get-Command", "Get-History", "Clear-Variable",
            "Clear-Content", "Rename-Item", "Remove-Item", "Set-Location", "Copy-Item", "Move-Item"
        ],
        "Miscellaneous": [
            "New-Item", "help", "echo", "cls", "Get-GitHub"
        ],
        "Games & Challenges": [
            "bypass-firewall"
        ]
    };
    const handleCommand = async () => {
        const { cmd, args, flags } = commandParser(input);
        if (!cmd) return;

        let response;
        const commandFn = commandList[cmd];

        if (!commandFn) {
            response = `Unrecognized command: ${cmd}`;
        } else {
            response = typeof commandFn === 'function'
                ? await commandFn({ args, flags })
                : commandFn;

            if (response === '__LAUNCH_MINIGAME__') {
                setFirewallMinigameVisible(true);
                response = '🧱 Attempting to bypass firewall...';
            }
        }

        setOutput(prev => [...prev, `PS ${currentDir}> ${input}`, response]);
        setInput('');
        setAiTip(getSmartTip(cmd, args));
        return response;
    };


    const handleKeyDown = e => e.key === 'Enter' && handleCommand();
    return (
        <>
            <canvas ref={canvasRef} className="matrix-background" />
            <div className="powershell-app">
                <aside className="sidebar">
                    <div className="tutorial-box">
                        <h3>🤖 AI Guide</h3>
                        <p>{aiTip}</p>
                    </div>
                    <div className="tutorial-box">
                        <h3>🎨 Theme</h3>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            style={{
                                padding: '0.4rem',
                                background: '#111',
                                color: '#0f0',
                                border: '1px solid limegreen',
                                borderRadius: '6px'
                            }}
                        >
                            <option value="matrix">🟩 Matrix Green</option>
                            <option value="cyberblue">🔷 Cyber Blue</option>
                            <option value="redhack">🔴 Red Hacker</option>
                            <option value="neonblue">🌌 Neon Blue</option>
                            <option value="matrixred">🔴 Matrix Red</option>
                            <option value="darkpurple">🟪 Dark Purple</option>
                            <option value="slategray">⬛ Slate Gray</option>
                            <option value="hackerorange">🟧 Hacker Orange</option>
                            <option value="terminalwhite">⬜ Terminal White</option>
                            <option value="mintgreen">🟢 Mint Green</option>
                            <option value="iceblue">🧊 Ice Blue</option>
                            <option value="nightmode">🌙 Night Mode</option>
                        </select>
                        <div className="tutorial-box">
                            <h3>🧠 GPT Model</h3>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                style={{
                                    padding: '0.4rem',
                                    background: '#111',
                                    color: '#0f0',
                                    border: '1px solid limegreen',
                                    borderRadius: '6px'
                                }}
                            >
                                <option value="meta-llama/llama-3-70b-instruct">LLaMA 3</option>
                                <option value="deepseek/deepseek-chat-v3-0324">DeepSeek V3</option>
                                <option value="tngtech/deepseek-r1t-chimera:free">DeepSeek R1T Chimera (Free)</option>
                                <option value="microsoft/phi-4-reasoning-plus:free">Phi 4 Reasoning Plus (Free)</option>
                                <option value="qwen/qwen3-1.7b:free">Qwen3 1.7B (Free)</option>
                                <option value="opengvlab/internvl3-14b:free">InternVL3 14B (Free)</option>
                            </select>
                        </div>
                    </div>
                    <div className="tutorial-box">
                        <h3>📘 Mini Textbook</h3>

                        <details open>
                            <summary><h4 style={{ color: '#00b7ff' }}>🛠 PowerShell Commands</h4></summary>
                            {Object.entries(powershellCommandGroups).map(([category, commands], i) => (
                                <details key={`powershell-group-${i}`}>
                                    <summary><strong>{category}</strong></summary>
                                    <div style={{ paddingLeft: '1rem' }}>
                                        {commands.map((cmd, j) => (
                                            <details key={`powershell-cmd-${i}-${j}`} id={cmd}>
                                                <summary><strong>{cmd}</strong></summary>
                                                <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                            </details>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </details>

                        <details>
                            <summary><h4 style={{ color: '#00ff00' }}>💀 Hacking Commands</h4></summary>

                            <details>
                                <summary><strong>🔐 Password Cracking</strong></summary>
                                {['hashcat', 'john', 'hydra'].map((cmd, index) => (
                                    <details key={`pw-${index}`} id={cmd}>
                                        <summary><strong>{cmd}</strong></summary>
                                        <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                    </details>
                                ))}
                            </details>

                            <details>
                                <summary><strong>🕵️ Reconnaissance</strong></summary>
                                {['whois', 'nslookup', 'dig', 'ping', 'trace-route'].map((cmd, index) => (
                                    <details key={`recon-${index}`} id={cmd}>
                                        <summary><strong>{cmd}</strong></summary>
                                        <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                    </details>
                                ))}
                            </details>

                            <details>
                                <summary><strong>💻 Vulnerability Scanning</strong></summary>
                                {['nmap', 'nikto', 'sqlmap'].map((cmd, index) => (
                                    <details key={`vuln-${index}`} id={cmd}>
                                        <summary><strong>{cmd}</strong></summary>
                                        <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                    </details>
                                ))}
                            </details>

                            <details>
                                <summary><strong>📡 Network Attacks</strong></summary>
                                {['tcpdump', 'netstat', 'wipe'].map((cmd, index) => (
                                    <details key={`net-${index}`} id={cmd}>
                                        <summary><strong>{cmd}</strong></summary>
                                        <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                    </details>
                                ))}
                            </details>

                            <details>
                                <summary><strong>🧰 Frameworks & Tools</strong></summary>
                                {['setoolkit', 'msfconsole', 'burpsuite'].map((cmd, index) => (
                                    <details key={`tools-${index}`} id={cmd}>
                                        <summary><strong>{cmd}</strong></summary>
                                        <p>{`Simulated: ${cmd.replace(/-/g, ' ')}`}</p>
                                    </details>
                                ))}
                            </details>

                        </details>



                    </div>
                    <div className="tutorial-box hacking-guide">
                        <h3>🛠️ Hacking Guide</h3>
                        <details>
                            <summary><strong>🔐 Password Cracking</strong></summary>
                            <p>Learn how attackers might simulate brute-force attempts. This guide is educational and emphasizes password security.</p>
                        </details>
                        <details>
                            <summary><strong>🕵️ Reconnaissance</strong></summary>
                            <p>Simulated: Techniques to gather public information about targets, such as WHOIS, ping, and social engineering tactics.</p>
                        </details>
                        <details>
                            <summary><strong>💻 Vulnerability Scanning</strong></summary>
                            <p>Simulated: Explore how tools like Nmap or Nessus identify vulnerabilities on networks and servers.</p>
                        </details>
                        <details>
                            <summary><strong>📡 Network Sniffing</strong></summary>
                            <p>Simulated: Understand how packet sniffers work and how encryption defends against snooping.</p>
                        </details>
                    </div>
                </aside>
                <div className="terminal">
                    <div className="gpt-section">
                        <div className="model-display">
              <span>
                  {selectedModel === 'meta-llama/llama-3-70b-instruct' && '🦙'}
                  {selectedModel === 'deepseek/deepseek-chat-v3-0324' && '🔍'}
                  {selectedModel === 'tngtech/deepseek-r1t-chimera:free' && '⚡'}
                  {selectedModel === 'microsoft/phi-4-reasoning-plus:free' && '🧩'}
                  {selectedModel === 'qwen/qwen3-1.7b:free' && '🐉'}
                  {selectedModel === 'opengvlab/internvl3-14b:free' && '🧪'}
                  Model: <strong>{selectedModel}</strong>
                </span>
                        </div>
                        <ChatWindow chatLog={chatLog} />
                        <GPTAssistant
                            apiKey="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"
                            model={selectedModel}
                            onResponse={(msg) => {
                                if (msg.role === 'user') {
                                    setChatLog(prev => [...prev, msg]);
                                }
                            }}
                            onFullResponse={(fullReply) => {
                                if (typingIntervalRef.current) {
                                    clearInterval(typingIntervalRef.current);
                                }
                                let i = 0;
                                const interval = setInterval(() => {
                                    setChatLog(prev => {
                                        const last = prev[prev.length - 1];
                                        if (!last || last.role !== 'assistant') {
                                            return [...prev, { role: 'assistant', content: fullReply.charAt(i) }];
                                        } else {
                                            const updated = [...prev];
                                            updated[updated.length - 1] = {
                                                ...last,
                                                content: last.content + fullReply.charAt(i),
                                            };
                                            return updated;
                                        }
                                    });

                                    i++;
                                    if (i >= fullReply.length) clearInterval(interval);
                                }, 40); // typing speed
                            }}
                        />
                        <button onClick={() => setChatLog([])} className="clear-chat">🧹 Clear Chat</button>
                    </div>
                    <div className="terminal-window">
                        {output.map((line, i) => (
                            <div key={i} className="terminal-line">{line}</div>
                        ))}
                        <div className="terminal-input">
                            <span className="prompt">PS {currentDir}&gt;</span>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="Type a PowerShell command..."
                            />
                        </div>
                    </div>




                    {tutorialVisible && (
                        <div className="tutorial-box">
                            <h3>👋 Welcome</h3>
                            <p>Try commands like <code>New-Item -Name "file.txt"</code> or <code>Get-Command</code>.</p>
                            <button onClick={() => setTutorialVisible(false)}>Got it!</button>
                        </div>
                    )}
                    {firewallMinigameVisible && (
                        <div className="minigame-modal">
                            <div className="minigame-content">
                                <h2>🛡️ Firewall Bypass Challenge</h2>
                                <p>Match the correct port to the open service:</p>
                                <ul>
                                    {[22, 80, 443].map((port) => (
                                        <li key={port}>
                                            <label>{port} → </label>
                                            <select
                                                value={portMatches[port]}
                                                onChange={(e) =>
                                                    setPortMatches((prev) => ({ ...prev, [port]: e.target.value }))
                                                }
                                            >
                                                <option value="">Select service</option>
                                                <option value="SSH">SSH</option>
                                                <option value="HTTP">HTTP</option>
                                                <option value="HTTPS">HTTPS</option>
                                                <option value="FTP">FTP</option>
                                                <option value="SMTP">SMTP</option>
                                            </select>
                                            <p className="hint">
                                                {port === 22 && 'Hint: Used for secure remote login'}
                                                {port === 80 && 'Hint: Standard port for loading websites (non-secure)'}
                                                {port === 443 && 'Hint: Secure websites use this port (🔒)'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const correct = portMatches[22] === 'SSH' &&
                                            portMatches[80] === 'HTTP' &&
                                            portMatches[443] === 'HTTPS';
                                        if (correct) {
                                            alert('✅ Correct! Firewall bypassed.');
                                            setOutput(prev => [...prev, '🎉 Firewall successfully bypassed! Access granted.']);
                                            setFirewallMinigameVisible(false);
                                        } else {
                                            alert('❌ Incorrect match. Try again!');
                                            setOutput(prev => [...prev, '❌ Firewall bypass failed. Try again.']);
                                        }
                                    }}
                                >
                                    Submit
                                </button>
                                <button type="button" onClick={() => setFirewallMinigameVisible(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                    </div>
            </div>
        </> // <-- This closes the fragment you opened at the start of return
    );
}




export default App;
