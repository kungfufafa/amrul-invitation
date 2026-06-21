# frozen_string_literal: true

class AssetIntegrityTest
  ROOT = File.expand_path("..", __dir__)
  LOCAL_PREFIXES = %w[media plugin public src].freeze

  def test_live_local_asset_references_resolve
    missing = html_asset_references + css_asset_references

    return if missing.empty?

    raise "Missing local assets:\n#{missing.sort.join("\n")}" 
  end

  private

  def html_asset_references
    html = File.read(File.join(ROOT, "index.html")).gsub(/<!--.*?-->/m, "")

    html.scan(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/i).flatten.map do |raw_path|
      local_path = normalize_local_path(raw_path)
      next unless local_path

      local_path unless File.file?(File.join(ROOT, local_path))
    end.compact
  end

  def css_asset_references
    Dir.glob(File.join(ROOT, "**", "*.css")).map do |css_file|
      File.read(css_file).scan(/url\(([^)]+)\)/i).flatten.map do |raw_path|
        path = raw_path.strip.delete_prefix("\"").delete_suffix("\"").delete_prefix("'").delete_suffix("'")
        next if external_path?(path)

        resolved = File.expand_path(path.split(/[?#]/).first, File.dirname(css_file))
        next if File.file?(resolved)

        "#{relative_path(css_file)} -> #{path}"
      end.compact
    end.flatten
  end

  def normalize_local_path(raw_path)
    path = raw_path.split(/[?#]/).first.sub(%r{\A\./}, "").sub(%r{\A/}, "")
    return unless LOCAL_PREFIXES.any? { |prefix| path.start_with?("#{prefix}/") }

    path
  end

  def external_path?(path)
    path.match?(%r{\A(?:data:|https?:|#)}i)
  end

  def relative_path(path)
    path.delete_prefix("#{ROOT}/")
  end
end

AssetIntegrityTest.new.test_live_local_asset_references_resolve
