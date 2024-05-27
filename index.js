import { showLoader } from '../../../loader.js';
import { POPUP_TYPE, Popup } from '../../../popup.js';
import { executeSlashCommands } from '../../../slash-commands.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { delay } from '../../../utils.js';

// ----------------- COPIED BECAUSE NOT EXPORTED --------------------------------
/**
 * Redirects the user to the home page.
 * Preserves the query string.
 */
function redirectToHome() {
    window.location.href = '/' + window.location.search;
}
// ----------------- END OF: COPIED BECAUSE NOT EXPORTED ------------------------

const restart = async()=>{
    toastr.info('Restarting SillyTavern');
    showLoader();
    await fetch('/api/plugins/process/restart');
    await delay(1000);
    while (!(await fetch('/', { method:'HEAD' })).ok) await delay(100);
    location.reload();
};
const shutdown = async()=>{
    toastr.info('Shutting down SillyTavern');
    await fetch('/api/plugins/process/exit');
    try {
        window.close();
    } catch {
        const dlg = new Popup('<h3>Close SillyTavern Client</h3>', POPUP_TYPE.TEXT);
        dlg.ok.addEventListener('click', ()=>window.close());
        await dlg.show();
    }
};
const goHome = async()=>{
    executeSlashCommands('/closechat');
};

let hasProcessPlugin = (await fetch('/api/plugins/process/', { method:'HEAD' })).ok;

if (hasProcessPlugin) {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'restart',
        callback: (args, value)=>restart(),
        helpString: 'Restart SillyTavern server and reload client.',
    }));
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'shutdown',
        callback: (args, value)=>shutdown(),
        helpString: 'Shut down SillyTavern server and close client.',
    }));
}

let isDiscord = null;
/**@type {HTMLElement}*/
let trigger;

const clickListener = async(evt)=>{
    if (!isDiscord) return;
    executeSlashCommands('/closechat');
};

const contextListener = async(evt)=>{
    evt.preventDefault();
    const ctx = document.createElement('div'); {
        ctx.classList.add('stdhl--ctxBlocker');
        ctx.title = '';
        ctx.addEventListener('click', (evt)=>{
            evt.stopPropagation();
            ctx.remove();
        });
        const list = document.createElement('ul'); {
            list.classList.add('stdhl--ctxMenu');
            list.classList.add('list-group');
            const rect = trigger.getBoundingClientRect();
            list.style.top = `${isDiscord ? rect.top : rect.bottom}px`;
            list.style.left = isDiscord ? 'var(--nav-bar-width)' : `${rect.left}px`;
            const homeItem = document.createElement('li'); {
                homeItem.classList.add('stdhl--ctxItem');
                homeItem.classList.add('stdhl--homeItem');
                homeItem.classList.add('list-group-item');
                homeItem.title = 'Return to landing page';
                homeItem.addEventListener('click', async()=>goHome());
                const ava = document.createElement('div'); {
                    ava.classList.add('stdhl--ctxAvatar');
                    ava.classList.add('stdhl--ctxIcon');
                    ava.classList.add('fa-solid', 'fa-home');
                    homeItem.append(ava);
                }
                const name = document.createElement('div'); {
                    name.classList.add('stdhl--ctxName');
                    name.textContent = 'Landing Page';
                    homeItem.append(name);
                }
                list.append(homeItem);
            }
            if (hasProcessPlugin) {
                const reloadItem = document.createElement('li'); {
                    reloadItem.classList.add('stdhl--ctxItem');
                    reloadItem.classList.add('list-group-item');
                    reloadItem.title = 'Restart SillyTavern server and reload client';
                    reloadItem.addEventListener('click', async()=>restart());
                    const ava = document.createElement('div'); {
                        ava.classList.add('stdhl--ctxAvatar');
                        ava.classList.add('stdhl--ctxIcon');
                        ava.classList.add('fa-solid', 'fa-rotate');
                        reloadItem.append(ava);
                    }
                    const name = document.createElement('div'); {
                        name.classList.add('stdhl--ctxName');
                        name.textContent = 'Restart';
                        reloadItem.append(name);
                    }
                    list.append(reloadItem);
                }
                const exitItem = document.createElement('li'); {
                    exitItem.classList.add('stdhl--ctxItem');
                    exitItem.classList.add('list-group-item');
                    exitItem.title = 'Shut down SillyTavern server and close client';
                    exitItem.addEventListener('click', async()=>shutdown());
                    const ava = document.createElement('div'); {
                        ava.classList.add('stdhl--ctxAvatar');
                        ava.classList.add('stdhl--ctxIcon');
                        ava.classList.add('fa-solid', 'fa-power-off');
                        exitItem.append(ava);
                    }
                    const name = document.createElement('div'); {
                        name.classList.add('stdhl--ctxName');
                        name.textContent = 'Shut Down';
                        exitItem.append(name);
                    }
                    list.append(exitItem);
                }
            }
            ctx.append(list);
        }
        document.body.append(ctx);
        trigger.append(ctx);
    }
};
const checkDiscord = async()=>{
    let newIsDiscord = window.getComputedStyle(document.body).getPropertyValue('--nav-bar-width') !== '';
    if (isDiscord != newIsDiscord) {
        isDiscord = newIsDiscord;
        document.body.classList[isDiscord ? 'add' : 'remove']('stdhl');
        document.body.classList[isDiscord ? 'remove' : 'add']('stdhl--nonDiscord');
        if (trigger) {
            trigger.removeEventListener('contextmenu', contextListener);
            trigger.removeEventListener('click', clickListener);
        }
        let hint;
        if (isDiscord) {
            trigger = document.querySelector('#top-bar');
            trigger.style.setProperty('--stdhl--iconSize', 'calc(var(--nav-bar-width) - 16px)');
            hint = 'Click to return to landing page\nRight-click to restart server or shutdown server';
            trigger.title = `${hint}`;
            trigger.addEventListener('contextmenu', contextListener);
            trigger.addEventListener('click', clickListener);
        } else {
            trigger = document.querySelector('#user-settings-button > .drawer-toggle');
            trigger.style.setProperty('--stdhl--iconSize', 'calc(var(--topBarBlockSize))');
            hint = 'Click to return to landing page\nRight-click to restart server or shutdown server';
            trigger.title = `${hint}`;
            trigger.addEventListener('contextmenu', contextListener);
        }
    }
    setTimeout(checkDiscord, 2000);
};
checkDiscord();
