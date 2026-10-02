import geopandas as gpd
import pyogrio
from shapely.geometry import box
import json

print("=== 1. Carregando Terras Indigenas ===")
tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
print("Total de TIs:", len(tis))
for idx, r in tis.iterrows():
    nome = r.get("Nome") or r.get("name") or r.get("terrai_nom") or f"TI #{idx}"
    print(f" - {nome}")

print("CRS das TIs:", tis.crs)
tis_bounds = tis.total_bounds
print("Bounding box das TIs:", tis_bounds)

shp_path = r"C:\QGIS_camadas\Camadas\Vetores\hidrografia\hydrography_amazonia_legal.shp"
print("\n=== 2. Inspecionando Shapefile da Amazonia Legal ===")
meta = pyogrio.read_info(shp_path)
print("CRS Shapefile:", meta.get("crs"))
print("Geometry type:", meta.get("geometry_type"))
print("Features count:", meta.get("features"))
print("Fields:", meta.get("fields"))
print("Spatial extent:", meta.get("spatial_index"))

# Vamos ler as feições do shapefile
print("\n=== 3. Lendo hydrography shapefile ===")
hydro = gpd.read_file(shp_path, engine="pyogrio")
print("Hydro total carregado:", len(hydro))
print("Colunas:", hydro.columns.tolist())
print("Amostra:")
print(hydro.head(3))
