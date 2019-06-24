initPlugin_ = function() {
    console.log("loading plugin...");
  
    this.plugin_ = window.document.createElement('embed');
    this.plugin_.setAttribute('src', '../../plugin/pnacl/ssh_client.nmf');
    this.plugin_.setAttribute('type', 'application/x-nacl');
  
    this.plugin_.addEventListener('load', () => {
      this.println(nassh.msg('PLUGIN_LOADING_COMPLETE'));
      setTimeout(this.onTTYChange_.bind(this));
      onComplete();
    });
  
    this.plugin_.addEventListener('message', (e) => {
      const name = e.data.name;
      const arguments = e.data.arguments;
  
      if (name in this.onPlugin_) {
        this.onPlugin_[name].apply(this, arguments);
      } else {
        console.log('Unknown message from plugin', e.data);
      }
    });
  
    this.plugin_.addEventListener('crash', (e) => {
      console.log('plugin crashed');
      this.executeContext.closeError('wam.FileSystem.Error.PluginCrash',
                                     [this.plugin_.exitStatus]);
    });
  
    document.body.insertBefore(this.plugin_, document.body.firstChild);
  
    // Set mimetype twice for https://crbug.com/371059
    this.plugin_.setAttribute('type', 'application/x-nacl');
  };