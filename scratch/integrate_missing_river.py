import geopandas as gpd
from shapely.ops import unary_union
import pandas as pd
import json
import os

print("=== 1. Carregando dados da hidrografia atual e o novo rio faltante ===")
p_curr = r"C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\data\massa_de_agua.geojson"
p_faltante = r"C:\QGIS_camadas\Camadas\Vetores\Camadas criadas\rio faltante webgis.shp"
p_out = r"C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\data\massa_de_agua.geojson"

curr = gpd.read_file(p_curr).to_crs("EPSG:4674")
faltante = gpd.read_file(p_faltante).to_crs("EPSG:4674")

rows = []

# [PT-BR] 1. Formata e padroniza as 14 feições de rio faltante webgis (incluindo Rio Mapuera e Lagoas)
# [EN] 1. Format and standardize the 14 features of missing river (including Mapuera River and Lagoons)
for idx, row in faltante.iterrows():
    raw_name = str(row.get('nmoriginal')).strip()
    if raw_name.lower() in ('nan', 'none', ''):
        name = f"Afluente / Canal Bacia Trombetas-Mapuera #{idx+1} (PA)"
        detipo = "Canal / Igarapé Secundário"
    else:
        name = f"{raw_name} (PA)"
        detipo = "Lago/Lagoa" if "lagoa" in raw_name.lower() else "Curso d'Água Principal / Calha Fluvial"
        
    mun = "Oriximiná"
    ufe = "PA"
    area = float(row.get('nuareakm2') or row.geometry.area * 12321)
    
    if "mapuera" in name.lower():
        ti_conn = "Trombetas/Mapuera / Nhamundá/Mapuera"
    elif "trombetas" in name.lower():
        ti_conn = "Kaxuyana-Tunayana / Trombetas/Mapuera"
    else:
        ti_conn = "Trombetas/Mapuera"
        
    rows.append({
        'nmoriginal': name,
        'detipomda': detipo,
        'dedominio': 'Domínio Público da União',
        'nmmun': mun,
        'nmufe': ufe,
        'nuareakm2': round(area, 4),
        'ti_conexao': ti_conn,
        'datum': 'SIRGAS 2000 (EPSG:4674)',
        'geometry': row.geometry
    })

gdf_faltante = gpd.GeoDataFrame(rows, crs="EPSG:4674")

# [PT-BR] 2. Combina com as feições existentes
# [EN] 2. Combine with existing features
combined = pd.concat([curr.drop(columns='gid', errors='ignore'), gdf_faltante], ignore_index=True)
combined = gpd.GeoDataFrame(combined, crs="EPSG:4674")

# [PT-BR] 3. Dissolve espacialmente polígonos contíguos com o mesmo nome para manter fluidez visual
# [EN] 3. Spatially dissolve contiguous polygons with same name to maintain visual fluidity
dissolved_rows = []
for (name, ufe, ti, mun, detipo, dedominio), group in combined.groupby(
    ['nmoriginal', 'nmufe', 'ti_conexao', 'nmmun', 'detipomda', 'dedominio']
):
    u = unary_union(group.geometry)
    geoms = list(u.geoms) if u.geom_type == 'MultiPolygon' else [u]
    for g in geoms:
        area_km2 = round(g.area * 12321, 4)
        dissolved_rows.append({
            'nmoriginal': name,
            'detipomda': detipo,
            'dedominio': dedominio,
            'nmmun': mun,
            'nmufe': ufe,
            'nuareakm2': area_km2,
            'ti_conexao': ti,
            'datum': 'SIRGAS 2000 (EPSG:4674)',
            'geometry': g
        })

final_gdf = gpd.GeoDataFrame(dissolved_rows, crs="EPSG:4674")
final_gdf['gid'] = range(1, len(final_gdf) + 1)
cols = ['gid', 'nmoriginal', 'detipomda', 'dedominio', 'nmmun', 'nmufe', 'nuareakm2', 'ti_conexao', 'datum', 'geometry']
final_gdf = final_gdf[cols]

# Simplificação suave de 0.00005 graus (~5.5 metros) para otimização web
final_gdf['geometry'] = final_gdf['geometry'].simplify(0.00005, preserve_topology=True)

final_gdf.to_file(p_out, driver="GeoJSON")

sz_mb = os.path.getsize(p_out) / (1024 * 1024)
print(f"Salvo em '{p_out}' com sucesso!")
print(f"Total de recursos hídricos recalculados: {len(final_gdf)}")
print(f"Área hídrica total: {final_gdf['nuareakm2'].sum():.2f} km²")
print(f"Tamanho do arquivo GeoJSON: {sz_mb:.2f} MB")
