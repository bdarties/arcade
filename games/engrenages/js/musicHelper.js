// Fonction utilitaire pour ajouter le gestionnaire de musique à une scène
export function addMusicManager(sceneClass) {
  const originalPreload = sceneClass.prototype.preload || function() {};
  const originalCreate = sceneClass.prototype.create || function() {};

  sceneClass.prototype.preload = function() {
    musicManager.preloadMusic(this);
    originalPreload.call(this);
  };

  sceneClass.prototype.create = function(data) {
    musicManager.scene = this;
    musicManager.play(this.scene.key, data?.fromPause);
    originalCreate.call(this, data);
  };

  return sceneClass;
}
